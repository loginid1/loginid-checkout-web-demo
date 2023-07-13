package handlers

/**
Public handles for user authentication processes
- RegisterInitHandler
- RegisterCompleteHandler
- AuthenticateInitHandler
- AuthenticateCompleteHanlder
- CredenticalAddInitHandler
- CredentialAddCompleteHandler
*/

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"gitlab.com/loginid/software/libraries/goutil.git/logger"
	http_common "gitlab.com/loginid/software/services/loginid-vault/http/common"
	"gitlab.com/loginid/software/services/loginid-vault/services"
	"gitlab.com/loginid/software/services/loginid-vault/services/email"
	"gitlab.com/loginid/software/services/loginid-vault/services/fido2"
	"gitlab.com/loginid/software/services/loginid-vault/services/keystore"
	"gitlab.com/loginid/software/services/loginid-vault/services/pass"
	"gitlab.com/loginid/software/services/loginid-vault/services/user"
	"gitlab.com/loginid/software/services/loginid-vault/utils"
)

type AuthHandler struct {
	UserService     *user.UserService
	Fido2Service    *fido2.Fido2Service
	KeystoreService *keystore.KeystoreService

	PassService *pass.PassService
}

type RegisterInitRequest struct {
	Username        string
	RegisterSession string `json:"register_session"`
}

/**
RegisterInitHandler
- parse username & attestationObject for certificate
- store username & public key to cache user object (ecdsa)
return: success or errorMessage
*/

func (u *AuthHandler) RegisterInitHandler(w http.ResponseWriter, r *http.Request) {

	var request RegisterInitRequest
	defer r.Body.Close()
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		http_common.SendErrorResponse(w, services.NewError("failed to parse request"))
		return
	}

	// proxy register request to fido2 service
	response, err := u.Fido2Service.RegisterInit(request.Username, request.RegisterSession)
	if err != nil {
		http_common.SendErrorResponse(w, *err)
		return
	}
	http_common.SendSuccessResponseRaw(w, response)
}

type RegisterCompleteRequest struct {
	Username   string `json:"username"`
	DeviceName string `json:"device_name"`
	UserAgent  struct {
		Browser string `json:"browser"`
		Device  string `json:"device"`
		OS      string `json:"operating_system"`
	} `json:"user_agent"`
	Challenge       string `json:"challenge"`
	CredentialUuid  string `json:"credential_uuid"`
	CredentialID    string `json:"credential_id"`
	ClientData      string `json:"client_data"`
	AttestationData string `json:"attestation_data"`
	EmailToken      string `json:"email_token"`
	SessionID       string `json:"session_id"`
	Scope           string `json:"scope"`
}

/**
RegisterCompleteHandler
	- parse public key
	- save user to DB
	return: success or errorMessage
*/
func (u *AuthHandler) RegisterCompleteHandler(w http.ResponseWriter, r *http.Request) {
	var request RegisterCompleteRequest
	defer r.Body.Close()
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		http_common.SendErrorResponse(w, services.NewError("failed to parse request"))
		return
	}

	if request.EmailToken != "" {

		// validate token
		claims, err := u.KeystoreService.VerifyEmailJWT(request.EmailToken)
		if err != nil {
			http_common.SendErrorResponse(w, services.NewError("invalid email validation"))
			return
		}

		if claims.Email != request.Username || claims.Session != request.SessionID || utils.IsExpired(claims.IssuedAt, 5*time.Minute) {
			http_common.SendErrorResponse(w, services.NewError("invalid email validation"))
			return
		}
	}

	// extract public_key and algorithm from attestation_data
	public_key, key_alg, err := fido2.ExtractPublicKey(request.AttestationData)

	if err != nil {
		http_common.SendErrorResponse(w, services.NewError("device key not supported"))
		return
	}

	// send to fido2 server
	// proxy register request to fido2 service
	fidoData, err := u.Fido2Service.RegisterComplete(request.Username, request.CredentialUuid, request.CredentialID, request.Challenge, request.AttestationData, request.ClientData)
	if err != nil {
		http_common.SendErrorResponse(w, *err)
		return
	}

	// save user to database
	deviceInfo, _ := json.Marshal(request.UserAgent)
	userid, err := u.UserService.CreateUserAccount(request.Username, request.DeviceName, deviceInfo, public_key, key_alg, request.Scope, false)
	if err != nil {
		http_common.SendErrorResponse(w, *err)
		return
	}

	// create email pass
	if request.EmailToken != "" {
		passData := pass.EmailPassSchema{
			Email: strings.ToLower(request.Username),
		}
		maskedData, _ := utils.MaskEmailAddress(strings.ToLower(request.Username))
		if err := u.PassService.ForceAddPass(r.Context(), userid, "My e-mail", "email", maskedData, pass.EmailPassSchemaType, passData); err != nil {
			http_common.SendErrorResponse(w, *err)
			return
		}
	}

	db_jwt, err := u.KeystoreService.GenerateDashboardJWT(fidoData.User.Username, userid, fidoData.User.ID, request.Scope)
	if err != nil {
		http_common.SendErrorResponse(w, *err)
		return
	}

	data := email.SignupMail{
		Url: fmt.Sprintf("%s/login", EmailBaseUrl),
	}
	if err := email.SendSignupEmail(request.Username, data); err != nil {
		logger.ForRequest(r).Error(err.Error())
	}

	resp := AuthCompleteResponse{
		Jwt: db_jwt,
	}
	http_common.SendSuccessResponse(w, resp)
}

type AuthenticateInitRequest struct {
	Username string `json:"username"`
}

func (u *AuthHandler) AuthenticateInitHandler(w http.ResponseWriter, r *http.Request) {
	var request AuthenticateInitRequest
	defer r.Body.Close()
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		http_common.SendErrorResponse(w, services.NewError("failed to parse request"))
		return
	}
	// proxy authenticate request to fido2 service
	response, err := u.Fido2Service.AuthenticateInit(request.Username)
	if err != nil {
		http_common.SendErrorResponse(w, *err)
		return
	}
	//logger.Global.Info(string(response))
	http_common.SendSuccessResponseRaw(w, response)
}

type AuthenticateCompleteRequest struct {
	Username          string `json:"username"`
	Challenge         string `json:"challenge"`
	CredentialID      string `json:"credential_id"`
	ClientData        string `json:"client_data"`
	AuthenticatorData string `json:"authenticator_data"`
	Signature         string `json:"signature"`
}

func (u *AuthHandler) AuthenticateCompleteHandler(w http.ResponseWriter, r *http.Request) {
	var request AuthenticateCompleteRequest
	defer r.Body.Close()
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		http_common.SendErrorResponse(w, services.NewError("failed to parse request"))
		return
	}

	fidoData, err := u.Fido2Service.AuthenticateComplete(request.Username, request.CredentialID, request.Challenge, request.AuthenticatorData, request.ClientData, request.Signature)
	if err != nil {
		http_common.SendErrorResponse(w, *err)
		return
	}

	user, err := u.UserService.GetUser(request.Username)
	if err != nil {
		http_common.SendErrorResponse(w, *err)
		return
	}

	db_jwt, err := u.KeystoreService.GenerateDashboardJWT(fidoData.User.Username, user.ID, fidoData.User.ID, user.Scopes)
	if err != nil {
		http_common.SendErrorResponse(w, *err)
		return
	}

	resp := AuthCompleteResponse{
		Jwt: db_jwt,
	}
	http_common.SendSuccessResponse(w, resp)
}

/// ADD CREDENTIAL

type CredentialAddInitRequest struct {
	Username string
	Code     string
}

/**
CredentialAddInitHandler
- parse username & attestationObject for certificate
- store username & public key to cache user object (ecdsa)
return: success or errorMessage
*/

func (u *AuthHandler) AddCredentialInitHandler(w http.ResponseWriter, r *http.Request) {

	var request CredentialAddInitRequest
	defer r.Body.Close()
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		http_common.SendErrorResponse(w, services.NewError("failed to parse request"))
		return
	}

	// proxy credential add request to fido2 service
	response, err := u.Fido2Service.AddCredentialInit(request.Username, request.Code)
	if err != nil {
		http_common.SendErrorResponse(w, *err)
		return
	}
	http_common.SendSuccessResponseRaw(w, response)
}

type CredentialAddCompleteRequest struct {
	Username   string `json:"username"`
	DeviceName string `json:"device_name"`
	UserAgent  struct {
		Browser string `json:"browser"`
		Device  string `json:"device"`
		OS      string `json:"operating_system"`
	} `json:"user_agent"`
	Challenge       string `json:"challenge"`
	CredentialUuid  string `json:"credential_uuid"`
	CredentialID    string `json:"credential_id"`
	ClientData      string `json:"client_data"`
	AttestationData string `json:"attestation_data"`
}

/**
CredentialAddCompleteHandler
	- parse public key
	- save credential to user DB
	return: success or errorMessage
*/
func (u *AuthHandler) AddCredentialCompleteHandler(w http.ResponseWriter, r *http.Request) {
	var request RegisterCompleteRequest
	defer r.Body.Close()
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		http_common.SendErrorResponse(w, services.NewError("failed to parse request"))
		return
	}

	// extract public_key and algorithm from attestation_data
	public_key, key_alg, err := fido2.ExtractPublicKey(request.AttestationData)

	if err != nil {
		http_common.SendErrorResponse(w, services.NewError("device key not supported"))
		return
	}

	/*
		pUser := user.PendingUser{}
		pUser.DeviceName = request.DeviceName
		pUser.Username = request.Username
		pUser.PublicKey = public_key
		pUser.KeyAlg = key_alg
	*/

	// send to fido2 server
	// proxy register request to fido2 service
	fidoData, err := u.Fido2Service.AddCredentialComplete(request.Username, request.CredentialUuid, request.CredentialID, request.Challenge, request.AttestationData, request.ClientData)
	if err != nil {
		http_common.SendErrorResponse(w, *err)
		return
	}

	// save user to database
	deviceInfo, _ := json.Marshal(request.UserAgent)
	err = u.UserService.AddUserCredential(request.Username, request.DeviceName, deviceInfo, public_key, key_alg)
	if err != nil {
		http_common.SendErrorResponse(w, *err)
		return
	}

	user, err := u.UserService.GetUser(request.Username)
	if err != nil {
		http_common.SendErrorResponse(w, *err)
		return
	}

	db_jwt, err := u.KeystoreService.GenerateDashboardJWT(fidoData.User.Username, user.ID, fidoData.User.ID, user.Scopes)
	if err != nil {
		http_common.SendErrorResponse(w, *err)
		return
	}

	resp := AuthCompleteResponse{
		Jwt: db_jwt,
	}
	http_common.SendSuccessResponse(w, resp)

}

func debugRequest(request AuthenticateCompleteRequest) {

	client_data, _ := utils.ConvertBase64UrlToBase64(request.ClientData)
	logger.Global.Info(fmt.Sprintf("client_data: %s", client_data))
	auth_data, _ := utils.ConvertBase64UrlToBase64(request.AuthenticatorData)
	logger.Global.Info(fmt.Sprintf("auth_data: %s", auth_data))
	sig_r, sig_s, err := utils.ConvertSignatureBase64RS(request.Signature)
	if err != nil {
		logger.Global.Error(err.Error())
	}
	logger.Global.Info(fmt.Sprintf("R: %s S: %s", sig_r, sig_s))
	// convert challenge to byte
	byte_challenge := []byte(request.Challenge)
	challenge := base64.StdEncoding.EncodeToString(byte_challenge)
	challengeb64, _ := utils.ConvertBase64UrlToBase64(request.Challenge)
	challenge_decode, err := base64.URLEncoding.DecodeString(request.Challenge + "=")
	if err != nil {
		logger.Global.Error(err.Error())
	}
	challenge_decode_raw, _ := base64.RawURLEncoding.DecodeString(request.Challenge)
	logger.Global.Info(fmt.Sprintf("challenge: %s", request.Challenge))
	logger.Global.Info(fmt.Sprintf("challenge_raw: %s", challenge))
	logger.Global.Info(fmt.Sprintf("challenge_b64: %s", challengeb64))
	logger.Global.Info(fmt.Sprintf("challenge_decode: %#s", challenge_decode))
	logger.Global.Info(fmt.Sprintf("challenge_decode_raw: %#s", challenge_decode_raw))
	logger.Global.Info(fmt.Sprintf("%d %d %d %d", len(request.Challenge), len(challenge_decode), len(challenge_decode_raw), bytes.Compare(challenge_decode, challenge_decode_raw)))
}
