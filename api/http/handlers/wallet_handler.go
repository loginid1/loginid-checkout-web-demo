package handlers

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/algorand/go-algorand-sdk/types"
	"gitlab.com/loginid/software/libraries/goutil.git/logger"
	http_common "gitlab.com/loginid/software/services/loginid-vault/http/common"
	"gitlab.com/loginid/software/services/loginid-vault/http/middlewares"
	"gitlab.com/loginid/software/services/loginid-vault/services"
	"gitlab.com/loginid/software/services/loginid-vault/services/algo"
	"gitlab.com/loginid/software/services/loginid-vault/services/fido2"
	"gitlab.com/loginid/software/services/loginid-vault/services/user"
	"gitlab.com/loginid/software/services/loginid-vault/utils"
)

type WalletHandler struct {
	UserService  *user.UserService
	Fido2Service *fido2.Fido2Service
	AlgoService  *algo.AlgoService
	AuthService  *middlewares.AuthService
}

type TxValidationRequest struct {
	Transactions []WalletTransaction
	Origin       string
}

type WalletTransaction struct {
	Txn string
}

type TxValidationResponse struct {
	TxnData  []string `json:"txn_data"`
	TxnType  []string `json:"txn_type"`
	Required []bool   `json:"required"`
	Username string   `json:"username"`
	Origin   string   `json:"origin"`
	Alias    string   `json:"alias"`
}

type PaymentTransaction struct {
	From        string `json:"from"`
	To          string `json:"to"`
	Fee         uint64 `json:"fee"`
	Amount      uint64 `json:"amount"`
	Note        string `json:"note"`
	RawData     string `json:"raw_data"`
	SignPayload string `json:"sign_payload"` // txnID
	SignNonce   string `json:"sign_nonce"`   // generated nonce
}

/**
* TxConnectHandler parse and validate raw transaction payload for signing
*
 */
func (h *WalletHandler) TxValidationHandler(w http.ResponseWriter, r *http.Request) {

	// check if session available
	var request TxValidationRequest
	defer r.Body.Close()
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		http_common.SendErrorResponse(w, services.NewError("failed to parse request"))
		return
	}

	if len(request.Transactions) != 1 {
		http_common.SendErrorResponse(w, services.NewError("error - supported one transaction"))
		return
	}

	rawData := request.Transactions[0].Txn
	txn, err := algo.ParseTransaction(rawData)
	if err != nil {
		logger.ForRequest(r).Error(err.Error())
		http_common.SendErrorResponse(w, services.NewError("invalid transaction format request"))
		return
	}
	genesisHash := base64.StdEncoding.EncodeToString(txn.GenesisHash[:])
	// check if sender origin has permission to user consent
	username, alias := h.AlgoService.CheckUserDappConsent(genesisHash, request.Origin, txn.Sender.String())
	if username == "" || alias == "" {
		http_common.SendErrorResponse(w, services.NewError("dapp transaction is not allowed"))
		return
	}

	//id := h.AlgoService.GetTransactionID(*txn)
	id := algo.TxIDFromTransactionB64(*txn)
	/*
		id_raw, err := base32.StdEncoding.WithPadding(base32.NoPadding).DecodeString(id)
		if err != nil {
			logger.ForRequest(r).Error("convert txID error")
		}*/
	nonce, _ := utils.GenerateRandomString(16)
	// filtering
	if txn.Type == types.PaymentTx {
		pTxn := PaymentTransaction{
			From:        txn.Sender.String(),
			To:          txn.Receiver.String(),
			Fee:         uint64(txn.Fee),
			Amount:      uint64(txn.Amount),
			Note:        string(txn.Note),
			RawData:     rawData,
			SignPayload: id,
			SignNonce:   nonce,
		}
		data, err := json.Marshal(pTxn)
		if err != nil {
			http_common.SendErrorResponse(w, services.NewError("transaction serialization error"))
			return
		}

		response := TxValidationResponse{
			TxnData:  []string{string(data)},
			TxnType:  []string{"payment"},
			Required: []bool{true},
			Username: username,
			Origin:   request.Origin,
			Alias:    alias,
		}
		http_common.SendSuccessResponse(w, response)
		return
	}
	http_common.SendErrorResponse(w, services.NewError("unsupported transaction"))

}

type TxInitRequest struct {
	Username string `json:"username"`
	Payload  string `json:"payload"`
	Nonce    string `json:"nonce"`
}

/**
 */

func (h *WalletHandler) TxInitHandler(w http.ResponseWriter, r *http.Request) {

	var request TxInitRequest
	defer r.Body.Close()
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		logger.ForRequest(r).Error(err.Error())
		http_common.SendErrorResponse(w, services.NewError("failed to parse request"))
		return
	}

	logger.Global.Info(fmt.Sprintf("txInit request %#v", request))

	fmt.Println([]byte(request.Payload))
	// proxy transaction/init request to fido2 service
	response, err := h.Fido2Service.TransactionInit(request.Username, request.Payload, request.Nonce)
	if err != nil {
		logger.ForRequest(r).Error(err.Message)
		http_common.SendErrorResponse(w, *err)
		return
	}
	http_common.SendSuccessResponseRaw(w, response)
}

type TxCompleteRequest struct {
	Username          string `json:"username"`
	Challenge         string `json:"challenge"`
	CredentialUuid    string `json:"credential_uuid"`
	CredentialID      string `json:"credential_id"`
	ClientData        string `json:"client_data"`
	AuthenticatorData string `json:"authenticator_data"`
	Signature         string `json:"signature"`
	TxID              string `json:"tx_id"`
	RawTxn            string `json:"raw_txn"`
	Post              bool   `json:"post"`
}

type TxCompleteResponse struct {
	Stxn string `json:"stxn"`
	TxID string `json:"tx_id"`
}

/**
TxCompleteHandler
*/
func (h *WalletHandler) TxCompleteHandler(w http.ResponseWriter, r *http.Request) {
	var request TxCompleteRequest
	defer r.Body.Close()
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		logger.ForRequest(r).Error(err.Error())
		http_common.SendErrorResponse(w, services.NewError("failed to parse request"))
		return
	}

	// send to fido2 server
	// proxy transaction/complete request to fido2 service
	response, err := h.Fido2Service.TransactionComplete(request.Username, request.TxID, request.CredentialID, request.Challenge, request.AuthenticatorData, request.ClientData, request.Signature)
	if err != nil {
		logger.ForRequest(r).Error(err.Message)
		http_common.SendErrorResponse(w, services.NewError("transaction fido error"))
		return
	}

	// need to conpute sign transaction package here
	id, stxn, err := h.AlgoService.SignedTransaction(request.RawTxn, request.Signature, request.ClientData, request.AuthenticatorData, response.Jwt)
	if err != nil {
		logger.ForRequest(r).Error(err.Message)
		http_common.SendErrorResponse(w, services.NewError("transaction signing error"))
		return
	}

	logger.ForRequest(r).Info("transaction success")

	http_common.SendSuccessResponse(w, TxCompleteResponse{TxID: id, Stxn: stxn})
}

type EnableRequest struct {
	AddressList []string `json:"address_list"`
	Network     string   `json:"network"`
	Origin      string   `json:"origin"`
}

/**
EnableHandler - enable dapp & wallet integration
*/
func (h *WalletHandler) EnableHandler(w http.ResponseWriter, r *http.Request) {
	session, err := h.AuthService.ValidateSessionToken(r)
	if err != nil {
		http_common.SendErrorResponse(w, services.NewError("not authorized"))
		return
	}
	var request EnableRequest
	defer r.Body.Close()
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		http_common.SendErrorResponse(w, services.NewError("failed to parse request"))
		return
	}

	// create enable accounts

	genesis, sErr := h.AlgoService.AddEnableAccounts(session.Username, request.AddressList, request.Origin, request.Network)
	if sErr != nil {
		http_common.SendErrorResponse(w, *sErr)
		return
	}

	http_common.SendSuccessResponse(w, genesis)

}
