package handlers

/**
 */

import (
	"net/http"

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

	username := r.Context().Value("username").(string)
	credentials, err := u.UserService.GetCredentialList(username)
	if err != nil {
		SendErrorResponse(w, services.NewError("no credential found"))
		return
	}

	SendSuccessResponse(w, CredentialListResponse{Credentials: credentials})
}

func (u *UserHandler) GetUserProfileHandler(w http.ResponseWriter, r *http.Request) {
	username := r.Context().Value("username").(string)
	profile, err := u.UserService.GetProfile(username)
	if err != nil {
		SendErrorResponse(w, services.NewError("no profile found"))
		return
	}

	SendSuccessResponse(w, profile)
}

func (u *UserHandler) AddDeviceHandler(w http.ResponseWriter, r *http.Request) {

}

type RecoveryPhrase struct {
	ID         string `json:"id"`
	PublicKey  string `json:"public_key"`
	PrivateKey string `json:"private_key"`
}

func (u *UserHandler) CreateRecoveryHandler(w http.ResponseWriter, r *http.Request) {
	username := r.Context().Value("username").(string)
	mnemonic, recovery, err := u.UserService.CreateRecovery(username)
	if err != nil {
		SendErrorResponse(w, services.NewError("fail to create mnemonic recovery code"))
		return
	}

	response := RecoveryPhrase{ID: recovery.ID, PublicKey: recovery.PublicKey, PrivateKey: mnemonic}

	SendSuccessResponse(w, response)

}

type RecoveryListResponse struct {
	Recovery []user.UserRecovery `json:"recovery"`
}

func (u *UserHandler) GetRecoveryListHandler(w http.ResponseWriter, r *http.Request) {
	username := r.Context().Value("username").(string)
	recovery, err := u.UserService.GetRecoveryList(username)
	if err != nil {
		SendErrorResponse(w, services.NewError("no recovery found"))
		return
	}

	SendSuccessResponse(w, RecoveryListResponse{Recovery: recovery})
}
