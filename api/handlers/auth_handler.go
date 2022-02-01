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
	"encoding/json"
	"net/http"

	"gitlab.com/loginid/software/services/loginid-vault/services"
	"gitlab.com/loginid/software/services/loginid-vault/services/fido2"
	"gitlab.com/loginid/software/services/loginid-vault/services/user"
)

type AuthHandler struct {
	UserService  *user.UserService
	Fido2Service *fido2.Fido2Service
}

type RegisterInitRequest struct {
	Username string
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
		SendErrorResponse(w, services.NewError("failed to parse request"))
		return
	}

	// proxy register request to fido2 service
	response, err := u.Fido2Service.RegisterInit(request.Username)
	if err != nil {
		SendErrorResponse(w, *err)
		return
	}
	SendSuccessResponseRaw(w, response)
}

type RegisterCompleteRequest struct {
	Username        string `json:"username"`
	DeviceName      string `json:"device_name"`
	Challenge       string `json:"challenge"`
	CredentialUuid  string `json:"credential_uuid"`
	CredentialID    string `json:"credential_id"`
	ClientData      string `json:"client_data"`
	AttestationData string `json:"attestation_data"`
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
		SendErrorResponse(w, services.NewError("failed to parse request"))
		return
	}
	// check user pending in cache
	/*
		pUser, err := u.UserService.GetPendingUser(request.Username)
		if err != nil {
			errorResponse(w, *err)
			return
		}
	*/

	// extract public_key and algorithm from attestation_data
	public_key, key_alg, err := fido2.ExtractPublicKey(request.AttestationData)

	if err != nil {
		SendErrorResponse(w, services.NewError("device key not supported"))
		return
	}
	pUser := user.PendingUser{}
	pUser.DeviceName = request.DeviceName
	pUser.Username = request.Username
	pUser.PublicKey = public_key
	pUser.KeyAlg = key_alg

	// send to fido2 server
	// proxy register request to fido2 service
	response, err := u.Fido2Service.RegisterComplete(request.Username, request.CredentialUuid, request.CredentialID, request.Challenge, request.AttestationData, request.ClientData)
	if err != nil {
		SendErrorResponse(w, *err)
		return
	}

	//logger.Global.Info(string(response))
	// save user to database
	err = u.UserService.CreateUserAccount(request.Username, request.DeviceName, public_key, key_alg)
	if err != nil {
		SendErrorResponse(w, *err)
		return
	}

	SendSuccessResponseRaw(w, response)
}

type AuthenticateInitRequest struct {
	Username string `json:"username"`
}

func (u *AuthHandler) AuthenticateInitHandler(w http.ResponseWriter, r *http.Request) {
	var request AuthenticateInitRequest
	defer r.Body.Close()
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		SendErrorResponse(w, services.NewError("failed to parse request"))
		return
	}
	// proxy authenticate request to fido2 service
	response, err := u.Fido2Service.AuthenticateInit(request.Username)
	if err != nil {
		SendErrorResponse(w, *err)
		return
	}
	//logger.Global.Info(string(response))
	SendSuccessResponseRaw(w, response)
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
		SendErrorResponse(w, services.NewError("failed to parse request"))
		return
	}
	//logger.Global.Debug(fmt.Sprintf("%#v", request))
	// proxy authenticate request to fido2 service
	response, err := u.Fido2Service.AuthenticateComplete(request.Username, request.CredentialID, request.Challenge, request.AuthenticatorData, request.ClientData, request.Signature)
	if err != nil {
		SendErrorResponse(w, *err)
		return
	}
	//logger.Global.Info(string(response))
	SendSuccessResponseRaw(w, response)
}
