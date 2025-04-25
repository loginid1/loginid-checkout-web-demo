/*
 *   Copyright (c) 2024 LoginID Inc
 *   All rights reserved.

 *   Licensed under the Apache License, Version 2.0 (the "License");
 *   you may not use this file except in compliance with the License.
 *   You may obtain a copy of the License at

 *   http://www.apache.org/licenses/LICENSE-2.0

 *   Unless required by applicable law or agreed to in writing, software
 *   distributed under the License is distributed on an "AS IS" BASIS,
 *   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *   See the License for the specific language governing permissions and
 *   limitations under the License.
 */

package handlers

/**
 */

import (
	"encoding/base64"
	"encoding/json"
	"net/http"
	"time"

	"github.com/algorand/go-algorand-sdk/client/v2/common/models"
	"github.com/algorand/go-algorand-sdk/encoding/msgpack"
	"gitlab.com/loginid/software/libraries/goutil.git/logger"
	http_common "gitlab.com/loginid/software/services/loginid-vault/http/common"
	"gitlab.com/loginid/software/services/loginid-vault/services"
	"gitlab.com/loginid/software/services/loginid-vault/services/algo"
	"gitlab.com/loginid/software/services/loginid-vault/services/fido2"
	"gitlab.com/loginid/software/services/loginid-vault/services/sendwyre"
	"gitlab.com/loginid/software/services/loginid-vault/services/user"
	"gitlab.com/loginid/software/services/loginid-vault/utils"
)

type AlgoHandler struct {
	UserService     *user.UserService
	AlgoService     *algo.AlgoService
	FidoService     *fido2.Fido2Service
	SendWyreService *sendwyre.SendWyreService
}

type FilterAlgoAccount struct {
	Alias           string               `json:"alias"`
	ID              string               `json:"id"`
	Address         string               `json:"address"`
	CredentialsName []string             `json:"credentials_name"`
	CredentialsID   []string             `json:"credentials_id"`
	RecoveryAddress string               `json:"recovery_address"`
	Status          string               `json:"status"`
	Iat             string               `json:"iat"`
	TealScript      string               `json:"teal_script"`
	Balance         *algo.AccountBalance `json:"balance"`
	AuthAddress     string               `json:"auth_address"`
	Transactions    []models.Transaction `json:"transactions"`
	Assets          []algo.ASAHolding    `json:"assets"`
	Dapps           []algo.EnableAccount `json:"dapps"`
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

		credentialsName := extractCredentialsName(account.Credentials)
		credentialsID := extractCredentialsID(account.Credentials)
		recoveryAddress := account.RecoveryAddress
		if account.AuthAccount != nil {
			credentialsName = extractCredentialsName(account.AuthAccount.Credentials)
			credentialsID = extractCredentialsID(account.AuthAccount.Credentials)
			recoveryAddress = account.AuthAccount.RecoveryAddress
		}
		fAccount := FilterAlgoAccount{
			Alias:           account.Alias,
			ID:              account.ID,
			Address:         account.Address,
			CredentialsName: credentialsName,
			CredentialsID:   credentialsID,
			RecoveryAddress: recoveryAddress,
			Status:          account.AccountStatus,
			Iat:             account.Iat.Format(time.RFC822),
			TealScript:      account.TealScript,
		}
		if account.AuthAddress != nil {
			fAccount.AuthAddress = *account.AuthAddress
		}
		if account.Balance != nil {
			fAccount.Balance = account.Balance
		}
		if include_balance {
			txn, _ := h.AlgoService.GetTransaction(fAccount.Address, 4)
			if txn != nil {
				fAccount.Transactions = txn.Transactions
			}
			// get top 5 assets
			asa, _ := h.AlgoService.GetAccountAssets(fAccount.Address)
			if asa != nil {
				fAccount.Assets = asa.Assets
			}
			// get recent dapp
			dapp, _ := h.AlgoService.GetEnableAccountList(session.Username, fAccount.Address)
			if dapp != nil {
				fAccount.Dapps = dapp
			}
		}
		fAccounts = append(fAccounts, fAccount)
	}

	http_common.SendSuccessResponse(w, AccountListResponse{Accounts: fAccounts})
}

func (h *AlgoHandler) GetAccountHandler(w http.ResponseWriter, r *http.Request) {

	session := r.Context().Value("session").(services.UserSession)
	address := r.URL.Query().Get("address")
	iBalance := r.URL.Query().Get("include_balance")
	include_balance := false
	if iBalance == "true" {
		include_balance = true
	}
	account, err := h.AlgoService.GetAccount(session.Username, address, include_balance)
	if err != nil {
		http_common.SendErrorResponse(w, services.NewError("no account found"))
		return
	}

	credentialsName := extractCredentialsName(account.Credentials)
	credentialsID := extractCredentialsID(account.Credentials)
	recoveryAddress := account.RecoveryAddress
	if account.AuthAccount != nil {
		credentialsName = extractCredentialsName(account.AuthAccount.Credentials)
		credentialsID = extractCredentialsID(account.AuthAccount.Credentials)
		recoveryAddress = account.AuthAccount.RecoveryAddress
	}

	fAccount := FilterAlgoAccount{
		Alias:           account.Alias,
		ID:              account.ID,
		Address:         account.Address,
		CredentialsName: credentialsName,
		CredentialsID:   credentialsID,
		RecoveryAddress: recoveryAddress,
		Status:          account.AccountStatus,
		Iat:             account.Iat.Format(time.RFC822),
		TealScript:      account.TealScript,
	}
	if account.AuthAddress != nil {
		fAccount.AuthAddress = *account.AuthAddress
	}
	if account.Balance != nil {
		fAccount.Balance = account.Balance
	}

	http_common.SendSuccessResponse(w, fAccount)
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

func extractCredentialsID(credentials []user.UserCredential) []string {
	var value []string
	for _, cred := range credentials {
		value = append(value, cred.ID)
	}
	return value
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
	enableAccounts, err := h.AlgoService.GetEnableAccountList(session.Username, "")
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
	transactions, sErr := h.AlgoService.GetTransaction(request.Address, 100)
	if sErr != nil {
		http_common.SendErrorResponse(w, *sErr)
		return
	}

	http_common.SendSuccessResponse(w, transactions)

}

type AssetRequest struct {
	Address   string `json:"address"`
	Limit     int    `json:"limit"`
	NextToken string `json:"next_token"`
}

func (h *AlgoHandler) GetAssetHandler(w http.ResponseWriter, r *http.Request) {
	//session := r.Context().Value("session").(services.UserSession)
	var request AssetRequest
	defer r.Body.Close()
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		http_common.SendErrorResponse(w, services.NewError("failed to parse request"))
		return
	}
	assets, sErr := h.AlgoService.GetAccountAssets(request.Address)
	if sErr != nil {
		http_common.SendErrorResponse(w, *sErr)
		return
	}

	http_common.SendSuccessResponse(w, assets)

}

type RekeyInitRequest struct {
	Address          string   `json:"address"`
	CredentialIDList []string `json:"cred_id_list"`
	Recovery         string   `json:"recovery"`
}

type RekeyInitResponse struct {
	RawTxn string      `json:"raw_txn"`
	Fido   interface{} `json:"fido"`
}

func (h *AlgoHandler) RekeyInitHandler(w http.ResponseWriter, r *http.Request) {

	var request RekeyInitRequest
	defer r.Body.Close()
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		http_common.SendErrorResponse(w, services.NewError("failed to parse request"))
		return
	}
	session := r.Context().Value("session").(services.UserSession)

	_, txn, err := h.AlgoService.RekeyAccountInit(session.Username, request.Address, request.CredentialIDList, request.Recovery)

	if err != nil {
		http_common.SendErrorResponse(w, *err)
		return
	}

	id := algo.TxIDFromTransactionB64(*txn)

	// proxy transaction/init request to fido2 service
	nonce, _ := utils.GenerateRandomString(16)
	response, err := h.FidoService.TransactionInit(session.Username, id, nonce)
	if err != nil {
		logger.ForRequest(r).Error(err.Message)
		http_common.SendErrorResponse(w, *err)
		return
	}

	var fido interface{}
	json.Unmarshal(response, &fido)
	rawTxn := base64.StdEncoding.EncodeToString(msgpack.Encode(txn))

	rekeyResponse := RekeyInitResponse{
		Fido:   fido,
		RawTxn: rawTxn,
	}
	http_common.SendSuccessResponse(w, rekeyResponse)
}

type RekeyCompleteRequest struct {
	Username          string `json:"username"`
	Challenge         string `json:"challenge"`
	CredentialUuid    string `json:"credential_uuid"`
	CredentialID      string `json:"credential_id"`
	ClientData        string `json:"client_data"`
	AuthenticatorData string `json:"authenticator_data"`
	Signature         string `json:"signature"`
	TxID              string `json:"tx_id"`
	RawTxn            string `json:"raw_txn"`
}

type RekeyCompleteResponse struct {
	Stxn string `json:"stxn"`
	TxID string `json:"tx_id"`
}

/*
*
RekeyCompleteHandler
*/
func (h *AlgoHandler) RekeyCompleteHandler(w http.ResponseWriter, r *http.Request) {
	var request TxCompleteRequest
	defer r.Body.Close()
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		logger.ForRequest(r).Error(err.Error())
		http_common.SendErrorResponse(w, services.NewError("failed to parse request"))
		return
	}
	session := r.Context().Value("session").(services.UserSession)

	txn, err := algo.ParseTransaction(request.RawTxn)
	if err != nil {
		logger.ForRequest(r).Error(err.Error())
		http_common.SendErrorResponse(w, services.NewError("invalid transaction format request"))
		return
	}
	// send to fido2 server
	// proxy transaction/complete request to fido2 service
	response, sErr := h.FidoService.TransactionComplete(session.Username, request.TxID, request.CredentialID, request.Challenge, request.AuthenticatorData, request.ClientData, request.Signature)
	if err != nil {
		logger.ForRequest(r).Error(sErr.Message)
		http_common.SendErrorResponse(w, services.NewError("transaction fido error"))
		return
	}

	// need to conpute sign transaction package here
	id, stxn, sErr := h.AlgoService.SignedTransaction(request.RawTxn, request.Signature, request.ClientData, request.AuthenticatorData, response.Jwt, true)
	if sErr != nil {
		logger.ForRequest(r).Error(sErr.Message)
		http_common.SendErrorResponse(w, services.NewError("transaction signing error"))
		return
	}

	sErr = h.AlgoService.RekeyAccountComplete(session.Username, txn.Sender.String(), txn.RekeyTo.String())
	if sErr != nil {
		logger.ForRequest(r).Error(sErr.Message)
		http_common.SendErrorResponse(w, services.NewError("rekey update error"))
		return
	}

	http_common.SendSuccessResponse(w, TxCompleteResponse{TxID: id, Stxn: stxn})
}

/// INTERNAL TRANSACTIONS HANDLER

// AssetOptin

type AssetOptinRequest struct {
	ID      uint64 `json:"id"`
	Address string `json:"address"`
	Origin  string `json:"origin"`
}

/*
*
AssetOptinHandler "/algo/assetOptin"
*/
func (h *AlgoHandler) AssetOptinHandler(w http.ResponseWriter, r *http.Request) {

	var request AssetOptinRequest
	defer r.Body.Close()
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		http_common.SendErrorResponse(w, services.NewError("failed to parse request"))
		return
	}
	session := r.Context().Value("session").(services.UserSession)

	txn, asset, sErr := h.AlgoService.CreateAssetOptionTxn(session.Username, request.Address, request.ID)

	if sErr != nil {
		http_common.SendErrorResponse(w, *sErr)
		return
	}

	nonce, _ := utils.GenerateRandomString(16)
	id := algo.TxIDFromTransactionB64(*txn)
	rawData := algo.EncodeTransactionB64(*txn)

	base := BaseTransaction{
		From:        txn.Sender.String(),
		Fee:         uint64(txn.Fee),
		Note:        string(txn.Note),
		RawData:     rawData,
		SignPayload: id,
		SignNonce:   nonce,
		Username:    session.Username,
		Alias:       "",
		Require:     true,
	}
	aTxn := AssetOptin{
		Base:      base,
		Assetid:   uint64(txn.XferAsset),
		AssetName: asset.Params.Name,
		UnitName:  asset.Params.UnitName,
	}
	data, err := json.Marshal(aTxn)
	if err != nil {
		http_common.SendErrorResponse(w, services.NewError("failed to parse request"))
		return
	}

	response := TxValidationResponse{
		TxnData: []string{string(data)},
		TxnType: []string{"asset-optin"},
		Origin:  request.Origin,
	}
	http_common.SendSuccessResponse(w, response)
}

// Send Asset
// Send Payment

type SendPaymentRequest struct {
	Amount      uint64 `json:"amount"`
	FromAddress string `json:"from_address"`
	ToAddress   string `json:"to_address"`
	Origin      string `json:"origin"`
}

/*
*
SendPaymentHandler "/algo/sendPayment"
*/
func (h *AlgoHandler) SendPaymentHandler(w http.ResponseWriter, r *http.Request) {

	var request SendPaymentRequest
	defer r.Body.Close()
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		http_common.SendErrorResponse(w, services.NewError("failed to parse request"))
		return
	}
	session := r.Context().Value("session").(services.UserSession)

	txn, sErr := h.AlgoService.CreateSendPaymentTxn(session.Username, request.FromAddress, request.ToAddress, request.Amount)

	if sErr != nil {
		http_common.SendErrorResponse(w, *sErr)
		return
	}

	nonce, _ := utils.GenerateRandomString(16)
	id := algo.TxIDFromTransactionB64(*txn)
	rawData := algo.EncodeTransactionB64(*txn)

	base := BaseTransaction{
		From:        txn.Sender.String(),
		Fee:         uint64(txn.Fee),
		Note:        string(txn.Note),
		RawData:     rawData,
		SignPayload: id,
		SignNonce:   nonce,
		Username:    session.Username,
		Alias:       "",
		Require:     true,
	}
	aTxn := PaymentTransaction{
		Base:   base,
		Amount: uint64(txn.Amount),
		To:     txn.Receiver.String(),
	}
	data, err := json.Marshal(aTxn)
	if err != nil {
		http_common.SendErrorResponse(w, services.NewError("failed to parse request"))
		return
	}

	response := TxValidationResponse{
		TxnData: []string{string(data)},
		TxnType: []string{"payment"},
		Origin:  request.Origin,
	}
	http_common.SendSuccessResponse(w, response)
}

// AlgoPurchaseRequestHandler
type AlgoPurchaseRequest struct {
	Address     string `json:"address"`
	RedirectUrl string `json:"redirectUrl"`
}

func (h *AlgoHandler) AlgoPurchaseRequestHandler(w http.ResponseWriter, r *http.Request) {
	var request AlgoPurchaseRequest
	defer r.Body.Close()
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		logger.ForRequest(r).Error(err.Error())
		http_common.SendErrorResponse(w, services.NewError("failed to parse request"))
		return
	}
	session := r.Context().Value("session").(services.UserSession)
	response, sErr := h.SendWyreService.OrderInit(session.Username, request.Address, request.RedirectUrl)
	if sErr != nil {
		logger.ForRequest(r).Error(sErr.Message)
		http_common.SendErrorResponse(w, *sErr)
		return
	}

	http_common.SendSuccessResponse(w, response)

}
