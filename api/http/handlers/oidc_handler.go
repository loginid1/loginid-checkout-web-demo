package handlers

import (
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	"github.com/gorilla/schema"
	"github.com/redis/go-redis/v9"
	"gitlab.com/loginid/software/libraries/goutil.git"
	"gitlab.com/loginid/software/libraries/goutil.git/logger"
	http_common "gitlab.com/loginid/software/services/loginid-vault/http/common"
	"gitlab.com/loginid/software/services/loginid-vault/services"
	"gitlab.com/loginid/software/services/loginid-vault/services/app"
	"gitlab.com/loginid/software/services/loginid-vault/services/keystore"
	"gitlab.com/loginid/software/services/loginid-vault/services/user"
)

type OidcHandler struct {
	UserService     *user.UserService
	KeystoreService *keystore.KeystoreService
	AppService      *app.AppService
	RedisClient     *redis.Client
}

var decoder = schema.NewDecoder()
var API_BASEURL = goutil.GetEnv("WALLET_API_BASEURL", "http://localhost:3001")
var BASEURL = goutil.GetEnv("WALLET_BASEURL", "http://localhost:3001")

type OpenidConfiguration struct {
	Issuer                        string   `json:"issuer"`
	AuthorizationEndpoint         string   `json:"authorization_endpoint"`
	TokenEndpoint                 string   `json:"token_endpoint"`
	JwksUri                       string   `json:"jwks_uri"`
	ScopesSupported               []string `json:"scopes_supported"`
	CodeChallengeMethodsSupported []string `json:"code_challenge_methods_supported"`
	ResponseTypesSupported        []string `json:"response_types_supported"`
}

func (h *OidcHandler) Configuration(w http.ResponseWriter, r *http.Request) {

	configuration := OpenidConfiguration{
		Issuer:                        API_BASEURL,
		AuthorizationEndpoint:         fmt.Sprintf("%s/odic/auth", API_BASEURL),
		TokenEndpoint:                 fmt.Sprintf("%s/odic/token", API_BASEURL),
		JwksUri:                       fmt.Sprintf("%s/.well-known/jwks", API_BASEURL),
		ScopesSupported:               []string{"openid"},
		CodeChallengeMethodsSupported: []string{"S256"},
		ResponseTypesSupported:        []string{"code", "id_token", "id_token token"},
	}
	http_common.SendSuccessResponse(w, configuration)
}

type AuthorizationRequest struct {
	ClientID            string `schema:"client_id"`
	Scope               string `schema:"scope"`
	RedirectUri         string `schema:"redirect_uri"`
	CodeChallenge       string `schema:"code_challenge"`
	CodeChallengeMethod string `schema:"code_challenge_method"`
	ResponseType        string `schema:"response_type"`
	State               string `schema:"state"`
}

func (h *OidcHandler) Authorization(w http.ResponseWriter, r *http.Request) {

	clientID := r.URL.Query().Get("client_id")
	if clientID == "" {
		http_common.SendErrorResponse(w, services.NewError("missing client_id"))
		return
	}

	redirectUri := r.URL.Query().Get("redirect_uri")
	codeChallengeMethod := r.URL.Query().Get("code_challenge_method")
	if strings.ToLower(codeChallengeMethod) != "s256" {
		http_common.SendErrorResponse(w, services.NewError("invalid code challenge method"))
		return
	}
	codeChallenge := r.URL.Query().Get("code_challenge")
	if codeChallenge == "" {
		http_common.SendErrorResponse(w, services.NewError("missing code_challenge"))
		return
	}

	state := r.URL.Query().Get("state")

	//logger.ForRequest(r).Info(fmt.Sprintf("challenge: %s", codeChallenge))

	sesResp, serr := h.AppService.SetupOidcSession(clientID, redirectUri, codeChallenge, state, r.RemoteAddr)

	if serr != nil {

		http_common.SendErrorResponse(w, *serr)
		return
	}

	redirectUrl := fmt.Sprintf("%s/sdk/oidc/%s", BASEURL, sesResp.ID)
	// redirect
	http.Redirect(w, r, redirectUrl, http.StatusSeeOther)
}

type TokenRequest struct {
	ClientID    string
	Code        string
	CodeVerifer string
	GrantType   string // authorization_code
}

type TokenResponse struct {
	AccessToken string `json:"access_token"`
	IDToken     string `json:"id_token,omitemty"`
}

func (h *OidcHandler) Token(w http.ResponseWriter, r *http.Request) {

	//logger.ForRequest(r).Info("Token")

	code := r.FormValue("code")
	grantType := r.FormValue("grant_type")
	codeVerifier := r.FormValue("code_verifier")
	clientId := r.FormValue("client_id")

	if grantType != "authorization_code" {
		sendOidcError(w, "invalid_request", "invalid grant_type")
		return
	}
	if code == "" {
		sendOidcError(w, "invalid_request", "invalid code")
		return
	}

	// get session from clientId + codeVerifier (redis)
	hash := sha256.New()
	hash.Write([]byte(codeVerifier))
	code_challenge := base64.RawURLEncoding.EncodeToString(hash.Sum(nil))
	//logger.ForRequest(r).Info(fmt.Sprintf("challenge2 : %s, clientId : %s", code_challenge, clientId))
	key := fmt.Sprintf("%s/%s", clientId, code_challenge)

	sessionid, err := h.RedisClient.Get(r.Context(), key).Result()
	if err != nil {
		logger.ForRequest(r).Error(err.Error())
		sendOidcError(w, "invalid_request", "no session found")
		return
	}

	app, serr := h.AppService.GetSession(sessionid)
	if serr != nil {
		logger.ForRequest(r).Error(serr.Message)
		sendOidcError(w, "invalid_request", "no session found")
		return
	}

	if app.Token == "" {
		sendOidcError(w, "invalid_request", "invalid auth")
		return
	}

	if code != app.Oidc.Code {
		sendOidcError(w, "invalid_request", "invalid code")
		return
	}

	http_common.SendSuccessResponse(w, TokenResponse{AccessToken: app.Token})
}

func (h *OidcHandler) GetJwks(w http.ResponseWriter, r *http.Request) {
	jwks, serr := h.KeystoreService.GetJWKS()
	if serr != nil {
		http_common.SendErrorResponse(w, *serr)
		return
	}
	http_common.SendSuccessResponse(w, jwks)
}

type OidcError struct {
	Error            string `json:"error"`
	ErrorDescription string `json:"error_description"`
}

func sendOidcError(w http.ResponseWriter, code string, message string) {

	jsonResponse, jsonError := json.Marshal(OidcError{Error: code, ErrorDescription: message})

	if jsonError != nil {
		logger.Global.Error("failed to encode error json")
	}
	w.WriteHeader(http.StatusBadRequest)
	w.Header().Set("Content-Type", "application/json")
	w.Write(jsonResponse)
}
