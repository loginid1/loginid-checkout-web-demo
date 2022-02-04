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

	session := r.Context().Value("session").(UserSession)
	credentials, err := u.UserService.GetCredentialList(session.Username)
	if err != nil {
		SendErrorResponse(w, services.NewError("no credential found"))
		return
	}

	SendSuccessResponse(w, CredentialListResponse{Credentials: credentials})
}

func (u *UserHandler) GetUserProfileHandler(w http.ResponseWriter, r *http.Request) {
	session := r.Context().Value("session").(UserSession)
	profile, err := u.UserService.GetProfile(session.Username)
	if err != nil {
		SendErrorResponse(w, services.NewError("no profile found"))
		return
	}

	SendSuccessResponse(w, profile)
}

type RecoveryPhrase struct {
	ID         string `json:"id"`
	PublicKey  string `json:"public_key"`
	PrivateKey string `json:"private_key"`
}

func (u *UserHandler) CreateRecoveryHandler(w http.ResponseWriter, r *http.Request) {
	session := r.Context().Value("session").(UserSession)
	mnemonic, recovery, err := u.UserService.CreateRecovery(session.Username)
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
	session := r.Context().Value("session").(UserSession)
	recovery, err := u.UserService.GetRecoveryList(session.Username)
	if err != nil {
		SendErrorResponse(w, services.NewError("no recovery found"))
		return
	}

	SendSuccessResponse(w, RecoveryListResponse{Recovery: recovery})
}

func (u *UserHandler) GenerateCredentialCodeHandler(w http.ResponseWriter, r *http.Request) {
	session := r.Context().Value("session").(UserSession)

	response, err := u.Fido2Service.GenerateCode(session.UserID)
	if err != nil {
		SendErrorResponse(w, *err)
		return
	}
	SendSuccessResponseRaw(w, response)
}
