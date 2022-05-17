package handlers

/**
 */

import (
	"encoding/json"
	"net/http"
	"time"

	http_common "gitlab.com/loginid/software/services/loginid-vault/http/common"
	"gitlab.com/loginid/software/services/loginid-vault/services"
	"gitlab.com/loginid/software/services/loginid-vault/services/algo"
	"gitlab.com/loginid/software/services/loginid-vault/services/user"
)

type AlgoHandler struct {
	UserService *user.UserService
	AlgoService *algo.AlgoService
}

type FilterAlgoAccount struct {
	Alias           string               `json:"alias"`
	ID              string               `json:"id"`
	Address         string               `json:"address"`
	CredentialsName []string             `json:"credentials_name"`
	RecoveryAddress string               `json:"recovery_address"`
	Status          string               `json:"status"`
	Iat             string               `json:"iat"`
	TealScript      string               `json:"teal_script"`
	Balance         *algo.AccountBalance `json:"balance"`
}

type AccountListResponse struct {
	Accounts []FilterAlgoAccount `json:"accounts"`
}

func (h *AlgoHandler) GetAccountListHandler(w http.ResponseWriter, r *http.Request) {

	session := r.Context().Value("session").(services.UserSession)
	iBalance := r.URL.Query().Get("include_balance")
	include_balance := false
	if iBalance == "true" {
		include_balance = true
	}
	accounts, err := h.AlgoService.GetAccountList(session.Username, include_balance)
	if err != nil {
		http_common.SendErrorResponse(w, services.NewError("no account found"))
		return
	}
	var fAccounts []FilterAlgoAccount
	for _, account := range accounts {
		fAccount := FilterAlgoAccount{
			Alias:           account.Alias,
			ID:              account.ID,
			Address:         account.Address,
			CredentialsName: extractCredentialsName(account.Credentials),
			RecoveryAddress: account.RecoveryAddress,
			Status:          account.AccountStatus,
			Iat:             account.Iat.Format(time.RFC822),
			TealScript:      account.TealScript,
		}
		if account.Balance != nil {
			fAccount.Balance = account.Balance
		}
		fAccounts = append(fAccounts, fAccount)
	}

	http_common.SendSuccessResponse(w, AccountListResponse{Accounts: fAccounts})
}

type CreateAccountRequest struct {
	Alias            string   `json:"alias"`
	VerifyAddress    string   `json:"verify_address"`
	CredentialIDList []string `json:"cred_id_list"`
	Recovery         string   `json:"recovery"`
}

func (h *AlgoHandler) CreateAccountHandler(w http.ResponseWriter, r *http.Request) {

	var request CreateAccountRequest
	defer r.Body.Close()
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		http_common.SendErrorResponse(w, services.NewError("failed to parse request"))
		return
	}
	session := r.Context().Value("session").(services.UserSession)

	err := h.AlgoService.CreateAccount(session.Username, request.Alias, request.VerifyAddress, request.CredentialIDList, request.Recovery)

	if err != nil {
		http_common.SendErrorResponse(w, *err)
		return
	}
	http_common.SendSuccessResponse(w, map[string]interface{}{"success": true})
}

type RenameAccountRequest struct {
	ID    string `json:"id"`
	Alias string `json:"alias"`
}

func (h *AlgoHandler) RenameAccountHandler(w http.ResponseWriter, r *http.Request) {

	var request RenameAccountRequest
	defer r.Body.Close()
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		http_common.SendErrorResponse(w, services.NewError("failed to parse request"))
		return
	}

	err := h.AlgoService.RenameAccount(request.ID, request.Alias)
	if err != nil {
		http_common.SendErrorResponse(w, services.NewError("rename credential failed"))
		return
	}

	http_common.SendSuccess(w)
}

type GenerateScriptRequest struct {
	CredentialList []string `json:"credential_list"`
	Recovery       string   `json:"recovery"`
}

func (h *AlgoHandler) GenerateScriptHandler(w http.ResponseWriter, r *http.Request) {

	var request GenerateScriptRequest
	defer r.Body.Close()
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		http_common.SendErrorResponse(w, services.NewError("failed to parse request"))
		return
	}
	//session := r.Context().Value("session").(UserSession)

	script, err := h.AlgoService.GenerateFido2Signature(request.CredentialList, request.Recovery)
	if err != nil {
		http_common.SendErrorResponse(w, *err)
		return
	}
	http_common.SendSuccessResponse(w, script)
}

func extractCredentialsName(credentials []user.UserCredential) []string {
	var name []string
	for _, cred := range credentials {
		name = append(name, cred.Name)
	}
	return name
}

type QuickAccountCreationRequest struct {
	PublicKey string `json:"public_key"`
}

func (h *AlgoHandler) QuickAccountCreationHandler(w http.ResponseWriter, r *http.Request) {

	var request QuickAccountCreationRequest
	defer r.Body.Close()
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		http_common.SendErrorResponse(w, services.NewError("failed to parse request"))
		return
	}
	session := r.Context().Value("session").(services.UserSession)

	account, err := h.AlgoService.QuickAccountCreation(session.Username, request.PublicKey)
	if err != nil {
		http_common.SendErrorResponse(w, *err)
		return
	}
	fAccount := FilterAlgoAccount{
		Alias:           account.Alias,
		ID:              account.ID,
		Address:         account.Address,
		CredentialsName: extractCredentialsName(account.Credentials),
		RecoveryAddress: account.RecoveryAddress,
		Status:          account.AccountStatus,
		Iat:             account.Iat.Format(time.RFC822),
		TealScript:      account.TealScript,
	}
	http_common.SendSuccessResponse(w, fAccount)
}

type FilterEnableAccount struct {
	ID            string `json:"id"`
	WalletAddress string `json:"wallet_address"`
	Network       string `json:"network"`
	DappOrigin    string `json:"dapp_origin"`
	Iat           string `json:"iat"`
}

type EnableAccountListResponse struct {
	Accounts []FilterEnableAccount `json:"accounts"`
}

func (h *AlgoHandler) GetEnableAccountListHandler(w http.ResponseWriter, r *http.Request) {
	session := r.Context().Value("session").(services.UserSession)
	enableAccounts, err := h.AlgoService.GetEnableAccountList(session.Username)
	if err != nil {
		http_common.SendErrorResponse(w, services.NewError("no account found"))
		return
	}

	var fEnableAccounts []FilterEnableAccount
	for _, enableAccount := range enableAccounts {
		fEnableAccount := FilterEnableAccount{
			ID:            enableAccount.ID,
			WalletAddress: enableAccount.WalletAddress,
			Network:       enableAccount.Network,
			DappOrigin:    enableAccount.DappOrigin,
			Iat:           enableAccount.Iat.Format(time.RFC822),
		}
		fEnableAccounts = append(fEnableAccounts, fEnableAccount)
	}

	http_common.SendSuccessResponse(w, EnableAccountListResponse{Accounts: fEnableAccounts})
}

type RevokeEnableAccountRequest struct {
	ID string `json:"id"`
}

func (h *AlgoHandler) RevokeEnableAccountHandler(w http.ResponseWriter, r *http.Request) {

	var request RevokeEnableAccountRequest
	defer r.Body.Close()
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		http_common.SendErrorResponse(w, services.NewError("failed to parse request"))
		return
	}

	err := h.AlgoService.RevokeEnableAccount(request.ID)
	if err != nil {
		http_common.SendErrorResponse(w, services.NewError("no account found"))
		return
	}

	http_common.SendSuccess(w)

}

func (h *AlgoHandler) GetAccountInfoHandler(w http.ResponseWriter, r *http.Request) {
	session := r.Context().Value("session").(services.UserSession)
	accounts, err := h.AlgoService.GetAccountInfo(session.Username)
	if err != nil {
		http_common.SendErrorResponse(w, services.NewError("no account found"))
		return
	}

	http_common.SendSuccessResponse(w, accounts)

}

type TransactionRequest struct {
	Address   string `json:"address"`
	Limit     int    `json:"limit"`
	NextToken string `json:"next_token"`
}

func (h *AlgoHandler) GetTransactionHandler(w http.ResponseWriter, r *http.Request) {
	//session := r.Context().Value("session").(services.UserSession)
	var request TransactionRequest
	defer r.Body.Close()
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		http_common.SendErrorResponse(w, services.NewError("failed to parse request"))
		return
	}
	transactions, sErr := h.AlgoService.GetTransaction(request.Address)
	if sErr != nil {
		http_common.SendErrorResponse(w, *sErr)
		return
	}

	http_common.SendSuccessResponse(w, transactions)

}
