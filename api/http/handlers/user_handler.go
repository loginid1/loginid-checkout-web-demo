package handlers

/**
 */

import (
	"encoding/json"
	"net/http"

	http_common "gitlab.com/loginid/software/services/loginid-vault/http/common"
	"gitlab.com/loginid/software/services/loginid-vault/services"
	"gitlab.com/loginid/software/services/loginid-vault/services/app"
	"gitlab.com/loginid/software/services/loginid-vault/services/fido2"
	"gitlab.com/loginid/software/services/loginid-vault/services/user"
)

type UserHandler struct {
	UserService  *user.UserService
	Fido2Service *fido2.Fido2Service
	AppService   *app.AppService
}

type CredentialListResponse struct {
	Credentials []user.UserCredential `json:"credentials"`
}

func (h *UserHandler) GetCredentialListHandler(w http.ResponseWriter, r *http.Request) {

	session := r.Context().Value("session").(services.UserSession)
	credentials, err := h.UserService.GetCredentialList(session.Username)
	if err != nil {
		http_common.SendErrorResponse(w, services.NewError("no credential found"))
		return
	}

	http_common.SendSuccessResponse(w, CredentialListResponse{Credentials: credentials})
}

type RenameCredentialRequest struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

func (h *UserHandler) RenameCredentialHandler(w http.ResponseWriter, r *http.Request) {

	var request RenameCredentialRequest
	defer r.Body.Close()
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		http_common.SendErrorResponse(w, services.NewError("failed to parse request"))
		return
	}

	err := h.UserService.UserRepository.RenameCredential(request.ID, request.Name)
	if err != nil {
		http_common.SendErrorResponse(w, services.NewError("rename credential failed"))
		return
	}

	http_common.SendSuccess(w)
}

func (h *UserHandler) GetUserProfileHandler(w http.ResponseWriter, r *http.Request) {
	session := r.Context().Value("session").(services.UserSession)
	profile, err := h.UserService.GetProfile(session.Username)
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

func (h *UserHandler) CreateRecoveryHandler(w http.ResponseWriter, r *http.Request) {
	session := r.Context().Value("session").(services.UserSession)
	mnemonic, recovery, err := h.UserService.CreateRecovery(session.Username)
	if err != nil {
		http_common.SendErrorResponse(w, services.NewError("fail to create mnemonic recovery code"))
		return
	}

	response := RecoveryPhrase{ID: recovery.ID, PublicKey: recovery.PublicKey, PrivateKey: mnemonic}

	http_common.SendSuccessResponse(w, response)

}

func (h *UserHandler) GenerateRecoveryInitHandler(w http.ResponseWriter, r *http.Request) {
	session := r.Context().Value("session").(services.UserSession)
	mnemonic, recovery, err := h.UserService.GenerateRecoveryInit(session.Username)
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

func (h *UserHandler) GenerateRecoveryCompleteHandler(w http.ResponseWriter, r *http.Request) {
	session := r.Context().Value("session").(services.UserSession)
	var request GenerateRecoveryCompleteRequest
	defer r.Body.Close()
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		http_common.SendErrorResponse(w, services.NewError("failed to parse request"))
		return
	}

	err := h.UserService.GenerateRecoveryComplete(session.Username, request.PublicKey)
	if err != nil {
		http_common.SendErrorResponse(w, services.NewError("fail to create mnemonic recovery code"))
		return
	}

	http_common.SendSuccessResponse(w, map[string]interface{}{"success": true})

}

type RecoveryListResponse struct {
	Recovery []user.UserRecovery `json:"recovery"`
}

func (h *UserHandler) GetRecoveryListHandler(w http.ResponseWriter, r *http.Request) {
	session := r.Context().Value("session").(services.UserSession)
	recovery, err := h.UserService.GetRecoveryList(session.Username)
	if err != nil {
		http_common.SendErrorResponse(w, services.NewError("no recovery found"))
		return
	}

	http_common.SendSuccessResponse(w, RecoveryListResponse{Recovery: recovery})
}

func (h *UserHandler) GenerateCredentialCodeHandler(w http.ResponseWriter, r *http.Request) {
	session := r.Context().Value("session").(services.UserSession)

	response, err := h.Fido2Service.GenerateCode(session.UserID)
	if err != nil {
		http_common.SendErrorResponse(w, *err)
		return
	}
	http_common.SendSuccessResponseRaw(w, response)
}

// TODO: pagination
type ConsentListResponse struct {
	Consents []app.CustomConsent `json:"consents"`
}

func (h *UserHandler) GetConsentList(w http.ResponseWriter, r *http.Request) {

	session := r.Context().Value("session").(services.UserSession)

	consents, serr := h.AppService.ListConsentsByUsername(r.Context(), session.Username)
	//logger.ForRequest(r).Info(fmt.Sprintf("%#v", consents))
	if serr != nil {
		http_common.SendErrorResponse(w, services.NewError("no results found"))
		return
	}

	http_common.SendSuccessResponse(w, ConsentListResponse{Consents: consents})

}
