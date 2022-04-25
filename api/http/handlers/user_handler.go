package handlers

/**
 */

import (
	"encoding/json"
	"net/http"

	http_common "gitlab.com/loginid/software/services/loginid-vault/http/common"
	"gitlab.com/loginid/software/services/loginid-vault/services"
	"gitlab.com/loginid/software/services/loginid-vault/services/fido2"
	"gitlab.com/loginid/software/services/loginid-vault/services/user"
)

type UserHandler struct {
	UserService  *user.UserService
	Fido2Service *fido2.Fido2Service
}

type CredentialListResponse struct {
	Credentials []user.UserCredential `json:"credentials"`
}

func (u *UserHandler) GetCredentialListHandler(w http.ResponseWriter, r *http.Request) {

	session := r.Context().Value("session").(services.UserSession)
	credentials, err := u.UserService.GetCredentialList(session.Username)
	if err != nil {
		http_common.SendErrorResponse(w, services.NewError("no credential found"))
		return
	}

	http_common.SendSuccessResponse(w, CredentialListResponse{Credentials: credentials})
}

func (u *UserHandler) GetUserProfileHandler(w http.ResponseWriter, r *http.Request) {
	session := r.Context().Value("session").(services.UserSession)
	profile, err := u.UserService.GetProfile(session.Username)
	if err != nil {
		http_common.SendErrorResponse(w, services.NewError("no profile found"))
		return
	}

	http_common.SendSuccessResponse(w, profile)
}

type RecoveryPhrase struct {
	ID         string `json:"id"`
	PublicKey  string `json:"public_key"`
	PrivateKey string `json:"private_key"`
}

func (u *UserHandler) CreateRecoveryHandler(w http.ResponseWriter, r *http.Request) {
	session := r.Context().Value("session").(services.UserSession)
	mnemonic, recovery, err := u.UserService.CreateRecovery(session.Username)
	if err != nil {
		http_common.SendErrorResponse(w, services.NewError("fail to create mnemonic recovery code"))
		return
	}

	response := RecoveryPhrase{ID: recovery.ID, PublicKey: recovery.PublicKey, PrivateKey: mnemonic}

	http_common.SendSuccessResponse(w, response)

}

func (u *UserHandler) GenerateRecoveryInitHandler(w http.ResponseWriter, r *http.Request) {
	session := r.Context().Value("session").(services.UserSession)
	mnemonic, recovery, err := u.UserService.GenerateRecoveryInit(session.Username)
	if err != nil {
		http_common.SendErrorResponse(w, services.NewError("fail to create mnemonic recovery code"))
		return
	}

	response := RecoveryPhrase{ID: recovery.ID, PublicKey: recovery.PublicKey, PrivateKey: mnemonic}

	http_common.SendSuccessResponse(w, response)

}

type GenerateRecoveryCompleteRequest struct {
	PublicKey string `json:"public_key"`
}

func (u *UserHandler) GenerateRecoveryCompleteHandler(w http.ResponseWriter, r *http.Request) {
	session := r.Context().Value("session").(services.UserSession)
	var request GenerateRecoveryCompleteRequest
	defer r.Body.Close()
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		http_common.SendErrorResponse(w, services.NewError("failed to parse request"))
		return
	}

	err := u.UserService.GenerateRecoveryComplete(session.Username, request.PublicKey)
	if err != nil {
		http_common.SendErrorResponse(w, services.NewError("fail to create mnemonic recovery code"))
		return
	}

	http_common.SendSuccessResponse(w, map[string]interface{}{"success": true})

}

type RecoveryListResponse struct {
	Recovery []user.UserRecovery `json:"recovery"`
}

func (u *UserHandler) GetRecoveryListHandler(w http.ResponseWriter, r *http.Request) {
	session := r.Context().Value("session").(services.UserSession)
	recovery, err := u.UserService.GetRecoveryList(session.Username)
	if err != nil {
		http_common.SendErrorResponse(w, services.NewError("no recovery found"))
		return
	}

	http_common.SendSuccessResponse(w, RecoveryListResponse{Recovery: recovery})
}

func (u *UserHandler) GenerateCredentialCodeHandler(w http.ResponseWriter, r *http.Request) {
	session := r.Context().Value("session").(services.UserSession)

	response, err := u.Fido2Service.GenerateCode(session.UserID)
	if err != nil {
		http_common.SendErrorResponse(w, *err)
		return
	}
	http_common.SendSuccessResponseRaw(w, response)
}
