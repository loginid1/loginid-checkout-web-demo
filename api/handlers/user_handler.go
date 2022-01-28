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
		errorResponse(w, services.NewError("no credential found"))
		return
	}

	successResponse(w, CredentialListResponse{Credentials: credentials})
}

func (u *UserHandler) GetUserProfileHandler(w http.ResponseWriter, r *http.Request) {
	username := r.Context().Value("username").(string)
	profile, err := u.UserService.GetProfile(username)
	if err != nil {
		errorResponse(w, services.NewError("no profile found"))
		return
	}

	successResponse(w, profile)
}

func (u *UserHandler) AddDeviceHandler(w http.ResponseWriter, r *http.Request) {

}

func (u *UserHandler) AddRecoveryHandler(w http.ResponseWriter, r *http.Request) {

}
