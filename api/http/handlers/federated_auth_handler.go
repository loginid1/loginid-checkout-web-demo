package handlers

/**
Public handles for user authentication processes
- FederatedRegisterInitHandler
- FederatedRegisterCompleteHandler
- FederatedAuthenticateInitHandler
- FederatedAuthenticateCompleteHanlder
*/

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/gorilla/mux"
	"github.com/gorilla/websocket"
	"github.com/redis/go-redis/v9"
	"gitlab.com/loginid/software/libraries/goutil.git"
	"gitlab.com/loginid/software/libraries/goutil.git/logger"
	http_common "gitlab.com/loginid/software/services/loginid-vault/http/common"
	"gitlab.com/loginid/software/services/loginid-vault/services"
	"gitlab.com/loginid/software/services/loginid-vault/services/app"
	"gitlab.com/loginid/software/services/loginid-vault/services/email"
	"gitlab.com/loginid/software/services/loginid-vault/services/fido2"
	"gitlab.com/loginid/software/services/loginid-vault/services/keystore"
	"gitlab.com/loginid/software/services/loginid-vault/services/pass"
	"gitlab.com/loginid/software/services/loginid-vault/services/user"
	"gitlab.com/loginid/software/services/loginid-vault/utils"
)

type FederatedAuthHandler struct {
	UserService     *user.UserService
	Fido2Service    *fido2.Fido2Service
	KeystoreService *keystore.KeystoreService
	AppService      *app.AppService
	PassService     *pass.PassService
	RedisClient     *redis.Client
}

type SessionInitRequest struct {
	Origin string `json:"origin"`
	API    string `json:"api"`
	IP     string `json:"ip"`
}

type SessionInitResponse struct {
	ID string `json:"id"`
}

func (h *FederatedAuthHandler) SessionInitHandler(w http.ResponseWriter, r *http.Request) {

	var request SessionInitRequest
	defer r.Body.Close()
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		http_common.SendErrorResponse(w, services.NewError("failed to parse request"))
		return
	}

	id, serr := h.AppService.SetupSession(request.API, request.Origin, request.IP)

	if serr != nil {

		http_common.SendErrorResponse(w, *serr)
		return
	}
	// generated uuid

	session := SessionInitResponse{
		ID: id,
	}

	http_common.SendSuccessResponse(w, session)

}

type CheckUserRequest struct {
	Username string
}

func (h *FederatedAuthHandler) CheckUserHandler(w http.ResponseWriter, r *http.Request) {

	var request CheckUserRequest
	defer r.Body.Close()
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		http_common.SendErrorResponse(w, services.NewError("failed to parse request"))
		return
	}

	// proxy register request to fido2 service
	user, err := h.UserService.GetUser(request.Username)

	if err != nil {
		http_common.SendErrorResponseWithCode(w, "not_found", "not_found")
		return
	}
	if user.ID == "" {
		http_common.SendErrorResponseWithCode(w, "not_found", "not_found")
		return
	}
	http_common.SendSuccess(w)
}

type FederatedRegisterInitRequest struct {
	Username        string
	RegisterSession string `json:"register_session"`
}

/**
RegisterInitHandler
- parse username & attestationObject for certificate
- store username & public key to cache user object (ecdsa)
return: success or errorMessage
*/

func (h *FederatedAuthHandler) FederatedRegisterInitHandler(w http.ResponseWriter, r *http.Request) {

	var request FederatedRegisterInitRequest
	defer r.Body.Close()
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		http_common.SendErrorResponse(w, services.NewError("failed to parse request"))
		return
	}

	if !utils.IsEmail(request.Username) {
		http_common.SendErrorResponse(w, services.NewError("invalid email format"))
		return
	}

	/*
		email_url := goutil.GetEnv("EMAIL_BASEURL", "http://localhost:3000")
		token, serr := h.KeystoreService.GenerateEmailValidationJWT(request.Username)
		if serr != nil {
			logger.ForRequest(r).Error(serr.Message)
			http_common.SendErrorResponse(w, services.NewError("register failed - please try again "))
			return
		}
		// send email confirmation first
		mail_err := email.SendEmailValidation(request.Username, email_url, token)
		if mail_err != nil {

			logger.ForRequest(r).Error(mail_err.Error())
			http_common.SendErrorResponse(w, services.NewError("email delivery failed - please check email again "))
			return
		}
	*/

	// proxy register request to fido2 service
	response, err := h.Fido2Service.RegisterInit(request.Username, request.RegisterSession)
	if err != nil {
		http_common.SendErrorResponse(w, *err)
		return
	}
	http_common.SendSuccessResponseRaw(w, response)
}

type FederatedRegisterCompleteRequest struct {
	Username        string `json:"username"`
	DeviceName      string `json:"device_name"`
	Challenge       string `json:"challenge"`
	CredentialUuid  string `json:"credential_uuid"`
	CredentialID    string `json:"credential_id"`
	ClientData      string `json:"client_data"`
	AttestationData string `json:"attestation_data"`
	SessionID       string `json:"session_id"`
	EmailToken      string `json:"token"`
}

type AuthCompleteResponse struct {
	Jwt string `json:"jwt"`
}

/**
RegisterCompleteHandler
	- parse public key
	- save user to DB
	return: success or errorMessage
*/
func (h *FederatedAuthHandler) FederatedRegisterCompleteHandler(w http.ResponseWriter, r *http.Request) {
	var request FederatedRegisterCompleteRequest
	defer r.Body.Close()
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		http_common.SendErrorResponse(w, services.NewError("failed to parse request"))
		return
	}

	// validate token
	claims, err := h.KeystoreService.VerifyEmailJWT(request.EmailToken)
	if err != nil {
		http_common.SendErrorResponse(w, services.NewError("invalid email validation"))
		return
	}

	if claims.Email != request.Username || claims.Session != request.SessionID || utils.IsExpired(claims.IssuedAt, 5*time.Minute) {
		http_common.SendErrorResponse(w, services.NewError("invalid email validation"))
		return

	}

	// extract public_key and algorithm from attestation_data
	public_key, key_alg, err := fido2.ExtractPublicKey(request.AttestationData)

	if err != nil {
		http_common.SendErrorResponse(w, services.NewError("device key not supported"))
		return
	}
	pUser := user.PendingUser{}
	pUser.DeviceName = request.DeviceName
	pUser.Username = request.Username
	pUser.PublicKey = public_key
	pUser.KeyAlg = key_alg

	// send to fido2 server
	// proxy register request to fido2 service
	_, err = h.Fido2Service.RegisterComplete(request.Username, request.CredentialUuid, request.CredentialID, request.Challenge, request.AttestationData, request.ClientData)
	if err != nil {
		http_common.SendErrorResponse(w, *err)
		return
	}

	// save user to database
	userid, err := h.UserService.CreateUserAccount(request.Username, request.DeviceName, public_key, key_alg, true)
	if err != nil {
		http_common.SendErrorResponse(w, *err)
		return
	}

	// create email pass
	passData := pass.EmailPassSchema{
		Email: claims.Email,
	}
	if err := h.PassService.ForceAddPass(r.Context(), userid, "e-mail", "email", pass.EmailPassSchemaType, passData); err != nil {
		http_common.SendErrorResponse(w, *err)
		return
	}

	// update session
	sess, err := h.AppService.UpdateSession(request.SessionID, userid)
	if err != nil {
		http_common.SendErrorResponse(w, *err)
		return
	}

	// send ID token
	token := keystore.IDTokenClains{
		Client: sess.AppID,
		Sub:    request.Username,
		Iat:    time.Now().Unix(),
		Nonce:  "",
		Passes: []keystore.PassClaims{},
	}
	jwt, err := h.KeystoreService.GenerateIDTokenJWT(token)
	if err != nil {
		logger.ForRequest(r).Error(err.Message)
		http_common.SendErrorResponse(w, *err)
		return
	}
	// update token session
	_, err = h.AppService.UpdateSessionToken(request.SessionID, jwt)
	if err != nil {
		http_common.SendErrorResponse(w, *err)
		return
	}

	resp := AuthCompleteResponse{
		Jwt: jwt,
	}

	http_common.SendSuccessResponse(w, resp)
}

type FederatedAuthInitRequest struct {
	Username  string `json:"username"`
	SessionID string `json:"session_id"`
}

func (u *FederatedAuthHandler) FederatedAuthInitHandler(w http.ResponseWriter, r *http.Request) {
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

type FederatedAuthCompleteRequest struct {
	Username          string `json:"username"`
	Challenge         string `json:"challenge"`
	CredentialID      string `json:"credential_id"`
	ClientData        string `json:"client_data"`
	AuthenticatorData string `json:"authenticator_data"`
	Signature         string `json:"signature"`
	SessionID         string `json:"session_id"`
}

func (h *FederatedAuthHandler) FederatedAuthCompleteHandler(w http.ResponseWriter, r *http.Request) {
	var request FederatedAuthCompleteRequest
	defer r.Body.Close()
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		http_common.SendErrorResponse(w, services.NewError("failed to parse request"))
		return
	}

	_, err := h.Fido2Service.AuthenticateComplete(request.Username, request.CredentialID, request.Challenge, request.AuthenticatorData, request.ClientData, request.Signature)
	if err != nil {
		http_common.SendErrorResponse(w, *err)
		return
	}

	user, err := h.UserService.GetUser(request.Username)
	if err != nil {
		http_common.SendErrorResponse(w, *err)
		return
	}
	// update session
	sess, err := h.AppService.UpdateSession(request.SessionID, user.ID)
	if err != nil {
		http_common.SendErrorResponse(w, *err)
		return
	}

	// send ID token
	token := keystore.IDTokenClains{
		Client: sess.AppID,
		Sub:    request.Username,
		Iat:    time.Now().Unix(),
		Nonce:  "",
		Passes: []keystore.PassClaims{},
	}
	jwt, err := h.KeystoreService.GenerateIDTokenJWT(token)
	if err != nil {
		logger.ForRequest(r).Error(err.Message)
		http_common.SendErrorResponse(w, *err)
		return
	}

	// update token session
	_, err = h.AppService.UpdateSessionToken(request.SessionID, jwt)
	if err != nil {
		http_common.SendErrorResponse(w, *err)
		return
	}
	resp := AuthCompleteResponse{
		Jwt: jwt,
	}

	http_common.SendSuccessResponse(w, resp)
}

type CheckConsentRequest struct {
	Session string `json:"session"`
}

type CheckConsentResponse struct {
	Required bool   `json:"required"`
	Token    string `json:"token"`
}

func (h *FederatedAuthHandler) CheckConsentHandler(w http.ResponseWriter, r *http.Request) {

	var request CheckConsentRequest
	defer r.Body.Close()
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		http_common.SendErrorResponse(w, services.NewError("failed to parse request"))
		return
	}

	// check consent session
	result, token, err := h.AppService.CheckSessionConsent(request.Session)
	if err != nil {
		http_common.SendErrorResponse(w, *err)
		return
	}

	http_common.SendSuccessResponse(w, CheckConsentResponse{Required: !result, Token: token})
}

type SaveConsentRequest struct {
	Session string
}

type SaveConsentResponse struct {
	Token string `json:"token"`
}

func (h *FederatedAuthHandler) SaveConsentHandler(w http.ResponseWriter, r *http.Request) {

	var request SaveConsentRequest
	defer r.Body.Close()
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		http_common.SendErrorResponse(w, services.NewError("failed to parse request"))
		return
	}

	// save consent session
	result, token, err := h.AppService.SaveSessionConsent(request.Session)
	if err != nil {
		http_common.SendErrorResponse(w, *err)
		return
	}
	if !result {
		http_common.SendErrorResponse(w, services.NewError("fail to save consent"))
	}

	http_common.SendSuccessResponse(w, SaveConsentResponse{Token: token})
}

type FederatedEmailSessionRequest struct {
	Email   string
	Session string
	Origin  string
	Type    string
}

func (h *FederatedAuthHandler) FederatedSendEmailSessionHandler(w http.ResponseWriter, r *http.Request) {
	// session info

	var request FederatedEmailSessionRequest
	defer r.Body.Close()
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		http_common.SendErrorResponse(w, services.NewError("failed to parse request"))
		return
	}

	if !utils.IsEmail(request.Email) {
		http_common.SendErrorResponse(w, services.NewError("invalid email format"))
		return
	}

	//* send out email here

	request_type := keystore.KEmailClaimsLogin
	if request.Type == "register" {
		request_type = keystore.KEmailClaimsRegister
	}

	email_url := goutil.GetEnv("EMAIL_BASEURL", "http://localhost:3000")
	token, serr := h.KeystoreService.GenerateEmailValidationJWT(request.Email, request_type, request.Session)
	if serr != nil {
		logger.ForRequest(r).Error(serr.Message)
		http_common.SendErrorResponse(w, services.NewError("register failed - please try again "))
		return
	}
	// send email confirmation first
	mail_err := email.SendHtmlEmailValidation(request.Email, request.Type, email_url, request.Origin, token)
	if mail_err != nil {

		logger.ForRequest(r).Error(mail_err.Error())
		http_common.SendErrorResponse(w, services.NewError("email delivery failed - please check email again "))
		return
	}

	//email.SendCode(request.Email, "123456")
	http_common.SendSuccess(w)

}

type FederatedEmailValidationRequest struct {
	Token string
}

func (h *FederatedAuthHandler) FederatedEmailValidationHandler(w http.ResponseWriter, r *http.Request) {
	// session info

	var request FederatedEmailValidationRequest
	defer r.Body.Close()
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		http_common.SendErrorResponse(w, services.NewError("failed to parse request"))
		return
	}

	//* verify email here
	//
	claims, serr := h.KeystoreService.VerifyEmailJWT(request.Token)
	if serr != nil {
		logger.ForRequest(r).Error(serr.Message)
		http_common.SendErrorResponse(w, services.NewError("failed to verify email"))
		return
	}
	ctx := context.Background()

	err := h.RedisClient.Publish(ctx, claims.Session, request.Token).Err()
	if err != nil {
		logger.ForRequest(r).Error(serr.Message)
		http_common.SendErrorResponse(w, services.NewError("failed to verify email"))
		return
	}

	http_common.SendSuccess(w)

}

var cor_origins = goutil.GetEnv("CORS_ORIGINS", "http://localhost:3000,http://localhost:3030")
var cor_array = strings.Split(cor_origins, ",")
var upgrader = websocket.Upgrader{CheckOrigin: func(r *http.Request) bool {
	origin := r.Header.Get("Origin")
	for _, value := range cor_array {
		if origin == value {
			return true
		}
	}
	return false
}}

type FederatedEmailWSRequest struct {
	Email string `json:"email"`
	Type  string `json:"type"`
}

const EMAIL_TIMEOUT = 5

func (h *FederatedAuthHandler) FederatedEmailWSHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	session := vars["session"]
	if session == "" {
		return
	}
	logger.ForRequest(r).Info(session)
	ws, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		logger.ForRequest(r).Error(err.Error())
		return
	}
	defer ws.Close()

	msg := make(chan FederatedEmailWSRequest)
	timer := time.NewTimer(EMAIL_TIMEOUT * time.Minute)
wsloop:
	for {

		go readMessage(r, ws, msg)
		//var timer time.Timer
		select {
		case request := <-msg:
			//timer = time.NewTimer(EMAIL_TIMEOUT * time.Minute)
			go h.subscribeChannel(r, ws, h.RedisClient, session, request)
		case <-timer.C:
			logger.ForRequest(r).Info("socket close to timeout")
			break wsloop
		}

	}
}

func readMessage(r *http.Request, ws *websocket.Conn, m chan FederatedEmailWSRequest) {
	for {
		_, message, err := ws.ReadMessage()
		if err != nil {
			logger.ForRequest(r).Error(err.Error())
			break
		}
		logger.ForRequest(r).Info(fmt.Sprintf("message: %s", message))
		var request FederatedEmailWSRequest
		err = json.Unmarshal(message, &request)
		if err != nil {
			logger.ForRequest(r).Error(err.Error())
			break
		}
		m <- request
	}
}

func (h *FederatedAuthHandler) subscribeChannel(r *http.Request, ws *websocket.Conn, rdb *redis.Client, channel string, request FederatedEmailWSRequest) {

	ctx := context.Background()
	outSub := rdb.Subscribe(ctx, channel)

	// Close the subscription when we are done.
	defer outSub.Close()

	ch := outSub.Channel()

	for msg := range ch {
		//fmt.Println(msg.Channel, msg.Payload)
		claims, serr := h.KeystoreService.VerifyEmailJWT(msg.Payload)
		if serr != nil {

			logger.ForRequest(r).Error(serr.Message)
			break
		}
		//logger.ForRequest(r).Info(fmt.Sprintf("%#v claims: %#v", request.Email, claims))

		if claims.Email == request.Email && claims.Session == channel && !utils.IsExpired(claims.IssuedAt, 5*time.Minute) {
			// update session
			if request.Type == "login" {

				user, serr := h.UserService.GetUser(request.Email)
				if serr != nil {
					logger.ForRequest(r).Error(serr.Message)
					break
				}
				// update session
				sess, serr := h.AppService.UpdateSession(claims.Session, user.ID)
				if serr != nil {
					logger.ForRequest(r).Error(serr.Message)
					break
				}

				// send ID token
				token := keystore.IDTokenClains{
					Client: sess.AppID,
					Sub:    request.Email,
					Iat:    time.Now().Unix(),
					Nonce:  "",
					Passes: []keystore.PassClaims{},
				}
				jwt, serr := h.KeystoreService.GenerateIDTokenJWT(token)
				if serr != nil {
					logger.ForRequest(r).Error(serr.Message)
					break
				}

				err := ws.WriteMessage(websocket.TextMessage, []byte(jwt))
				if err != nil {
					logger.ForRequest(r).Error(err.Error())
					break
				}
			} else {

				err := ws.WriteMessage(websocket.TextMessage, []byte(msg.Payload))
				if err != nil {
					logger.ForRequest(r).Error(err.Error())
					break
				}
			}
		}
	}
}
