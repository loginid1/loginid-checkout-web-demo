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
	Txn    string
	Signer string
}

type TxValidationResponse struct {
	TxnData []string `json:"txn_data"`
	TxnType []string `json:"txn_type"`
	Origin  string   `json:"origin"`
}

type BaseTransaction struct {
	From        string `json:"from"`
	Fee         uint64 `json:"fee"`
	Note        string `json:"note"`
	RawData     string `json:"raw_data"`
	SignPayload string `json:"sign_payload"` // txnID
	SignNonce   string `json:"sign_nonce"`   // generated nonce
	Username    string `json:"username"`
	Alias       string `json:"alias"`
	Require     bool   `json:"require"`
}

type PaymentTransaction struct {
	Base   BaseTransaction `json:"base"`
	To     string          `json:"to"`
	Amount uint64          `json:"amount"`
}

type AssetOptin struct {
	Base      BaseTransaction `json:"base"`
	Assetid   uint64          `json:"assetid"`
	AssetName uint64          `json:"asset_name"`
}

type AssetTransfer struct {
	Base      BaseTransaction `json:"base"`
	To        string          `json:"to"`
	Amount    uint64          `json:"amount"`
	Assetid   uint64          `json:"assetid"`
	AssetName uint64          `json:"asset_name"`
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

	/*
		if len(request.Transactions) != 1 {
			http_common.SendErrorResponse(w, services.NewError("error - supported one transaction"))
			return
		}*/

	var txn_data_list []string
	var txn_type_list []string
	require_count := 0
	for _, txn := range request.Transactions {
		txdata, txtype, require, sErr := validateRequestTransaction(txn, request.Origin, h.AlgoService)
		if sErr != nil {
			logger.ForRequest(r).Error(sErr.Message)
			http_common.SendErrorResponse(w, *sErr)
			return
		}
		txn_data_list = append(txn_data_list, txdata)
		txn_type_list = append(txn_type_list, txtype)
		if require {
			require_count = require_count + 1
		}
	}
	if require_count > 0 {

		response := TxValidationResponse{
			TxnData: txn_data_list,
			TxnType: txn_type_list,
			Origin:  request.Origin,
		}
		http_common.SendSuccessResponse(w, response)
		return
	} else {

		http_common.SendErrorResponse(w, services.NewError("no signature require"))
		return
	}

}

func validateRequestTransaction(requestTxn WalletTransaction, origin string, algoService *algo.AlgoService) (string, string, bool, *services.ServiceError) {

	rawData := requestTxn.Txn
	txn, err := algo.ParseTransaction(rawData)
	if err != nil {
		return "", "", false, services.CreateError("invalid transaction format request")
	}
	genesisHash := base64.StdEncoding.EncodeToString(txn.GenesisHash[:])
	// check if sender origin has permission to user consent
	// check if signing required
	require_sign := false
	if requestTxn.Signer == txn.Sender.String() {
		require_sign = true
	}

	fmt.Printf("groupID: %v %s", txn.Group, base64.StdEncoding.EncodeToString(txn.Group[:]))
	var username, alias, nonce string

	if require_sign {

		username, alias = algoService.CheckUserDappConsent(genesisHash, origin, txn.Sender.String())
		if username == "" || alias == "" {
			return "", "", false, services.CreateError("dapp transaction is not allowed")
		}
		nonce, _ = utils.GenerateRandomString(16)
	}

	id := algo.TxIDFromTransactionB64(*txn)
	base := BaseTransaction{
		From:        txn.Sender.String(),
		Fee:         uint64(txn.Fee),
		Note:        string(txn.Note),
		RawData:     rawData,
		SignPayload: id,
		SignNonce:   nonce,
		Username:    username,
		Alias:       alias,
		Require:     require_sign,
	}
	// filtering
	if txn.Type == types.PaymentTx {
		pTxn := PaymentTransaction{
			Base:   base,
			To:     txn.Receiver.String(),
			Amount: uint64(txn.Amount),
		}
		data, err := json.Marshal(pTxn)
		if err != nil {
			return "", "", false, services.CreateError("transaction serialization error")
		}

		return string(data), "payment", require_sign, nil
	} else if txn.Type == types.AssetTransferTx {

		// check if asset transfer or opt-in
		if txn.Sender.String() == txn.AssetReceiver.String() && txn.AssetAmount == 0 {
			aTxn := AssetOptin{
				Base:    base,
				Assetid: uint64(txn.XferAsset),
			}
			data, err := json.Marshal(aTxn)
			if err != nil {
				return "", "", false, services.CreateError("transaction serialization error")
			}
			return string(data), "asset-optin", require_sign, nil
		} else {

			aTxn := AssetTransfer{
				Base:    base,
				To:      txn.AssetReceiver.String(),
				Amount:  uint64(txn.AssetAmount),
				Assetid: uint64(txn.XferAsset),
			}
			data, err := json.Marshal(aTxn)
			if err != nil {
				return "", "", false, services.CreateError("transaction serialization error")
			}
			return string(data), "asset-transfer", require_sign, nil
		}

	} else {
		return "", "", require_sign, services.CreateError("unsupported transaction")
	}
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
	id, stxn, err := h.AlgoService.SignedTransaction(request.RawTxn, request.Signature, request.ClientData, request.AuthenticatorData, response.Jwt, request.Post)
	if err != nil {
		logger.ForRequest(r).Error(err.Message)
		http_common.SendErrorResponse(w, services.NewError("transaction signing error"))
		return
	}

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
