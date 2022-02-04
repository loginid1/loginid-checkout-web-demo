package handlers

/**
 */

import (
	"encoding/json"
	"net/http"

	"gitlab.com/loginid/software/services/loginid-vault/services"
	"gitlab.com/loginid/software/services/loginid-vault/services/algo"
	"gitlab.com/loginid/software/services/loginid-vault/services/user"
)

type AlgoHandler struct {
	UserService *user.UserService
	AlgoService *algo.AlgoService
}

type AccountListResponse struct {
	Accounts []algo.AlgoAccount `json:"accounts"`
}

func (h *AlgoHandler) GetAccountListHandler(w http.ResponseWriter, r *http.Request) {

	session := r.Context().Value("session").(UserSession)
	accounts, err := h.AlgoService.GetAccountList(session.Username)
	if err != nil {
		SendErrorResponse(w, services.NewError("no account found"))
		return
	}

	SendSuccessResponse(w, AccountListResponse{Accounts: accounts})
}

type CreateAccountRequest struct {
	VerifyAddress  string   `json:"verify_address"`
	CredentialList []string `json:"credential_list"`
	Recovery       string   `json:"recovery"`
}

func (h *AlgoHandler) CreateAccountHandler(w http.ResponseWriter, r *http.Request) {

	var request CreateAccountRequest
	defer r.Body.Close()
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		SendErrorResponse(w, services.NewError("failed to parse request"))
		return
	}
	session := r.Context().Value("session").(UserSession)

	err := h.AlgoService.CreateAccount(session.Username, request.VerifyAddress, request.CredentialList, request.Recovery)

	if err != nil {
		SendErrorResponse(w, *err)
		return
	}
	SendSuccessResponse(w, map[string]interface{}{"success": true})
}

type GenerateScriptRequest struct {
	CredentialList []string `json:"credential_list"`
	Recovery       string   `json:"recovery"`
}

func (h *AlgoHandler) GenerateScriptHandler(w http.ResponseWriter, r *http.Request) {

	var request GenerateScriptRequest
	defer r.Body.Close()
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		SendErrorResponse(w, services.NewError("failed to parse request"))
		return
	}
	//session := r.Context().Value("session").(UserSession)

	script, err := h.AlgoService.GenerateFido2Signature(request.CredentialList, request.Recovery)
	if err != nil {
		SendErrorResponse(w, *err)
		return
	}
	SendSuccessResponse(w, script)
}
