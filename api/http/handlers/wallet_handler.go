package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/algorand/go-algorand-sdk/encoding/msgpack"
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

type TxConnectRequest struct {
	TxRawPayload string
	origin       string
}

type TxConnectResponse struct {
	TxRawPayload string
	TxNonce      string
	AlgoTxID     string
}

/**
* TxConnectHandler parse and validate raw transaction payload for signing
*
 */
func (h *WalletHandler) TxConnectHandler(w http.ResponseWriter, r *http.Request) {
	session := r.Context().Value("session").(services.UserSession)

	// check if session available
	var request TxConnectRequest
	defer r.Body.Close()
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		http_common.SendErrorResponse(w, services.NewError("failed to parse request"))
		return
	}

	txn, err := algo.ParseTransaction(request.TxRawPayload)
	if err != nil {
		logger.ForRequest(r).Error(err.Error())
		http_common.SendErrorResponse(w, services.NewError("invalid transaction format request"))
		return
	}
	// check if sender origin has permission to user consent
	allow := h.AlgoService.CheckUserDappConsent(session.Username, request.origin, txn.Sender.String())
	if !allow {
		http_common.SendErrorResponse(w, services.NewError("dapp transaction is not allowed"))
		return
	}

	// check Lease if not inject Lease value
	nonce, _ := utils.GenerateRandomString(32)
	//txn.AddLeaseWithFlatFee()
	//txn.AddLease([]byte(nonce))

	id := h.AlgoService.GetTransactionID(*txn)
	response := TxConnectResponse{
		TxRawPayload: string(msgpack.Encode(txn)),
		TxNonce:      nonce,
		AlgoTxID:     id,
	}
	http_common.SendSuccessResponse(w, response)

}

type TxInitRequest struct {
	Username  string `json:"username"`
	TxPayload string `json:"tx_payload"`
	TxNonce   string `json:"tx_nonce"`
}

/**
 */

func (h *WalletHandler) TxInitHandler(w http.ResponseWriter, r *http.Request) {

	session := r.Context().Value("session").(services.UserSession)
	var request TxInitRequest
	defer r.Body.Close()
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		logger.ForRequest(r).Error(err.Error())
		http_common.SendErrorResponse(w, services.NewError("failed to parse request"))
		return
	}

	// proxy transaction/init request to fido2 service
	response, err := h.Fido2Service.TransactionInit(session.Username, request.TxPayload, request.TxNonce)
	if err != nil {
		http_common.SendErrorResponse(w, *err)
		return
	}
	http_common.SendSuccessResponseRaw(w, response)
}

type TxCompleteRequest struct {
	Username        string `json:"username"`
	DeviceName      string `json:"device_name"`
	Challenge       string `json:"challenge"`
	CredentialUuid  string `json:"credential_uuid"`
	CredentialID    string `json:"credential_id"`
	ClientData      string `json:"client_data"`
	AttestationData string `json:"attestation_data"`
	TxID            string `json:"tx_id"`
	TxRawPayload    string `json:"tx_raw_payload"`
}

type TxCompleteResponse struct {
	TxSignPayload string `json:"tx_sign_payload"`
}

/**
TxCompleteHandler
*/
func (h *WalletHandler) TxCompleteHandler(w http.ResponseWriter, r *http.Request) {
	var request TxCompleteRequest
	defer r.Body.Close()
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		http_common.SendErrorResponse(w, services.NewError("failed to parse request"))
		return
	}

	// send to fido2 server
	// proxy transaction/complete request to fido2 service
	response, err := h.Fido2Service.TransactionComplete(request.Username, request.TxID, request.CredentialUuid, request.CredentialID, request.Challenge, request.AttestationData, request.ClientData)
	if err != nil {
		logger.ForRequest(r).Error(err.Message)
		http_common.SendErrorResponse(w, services.NewError("transaction error"))
		return
	}

	// need to conpute sign transaction package here

	http_common.SendSuccessResponseRaw(w, response)
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

	sErr := h.AlgoService.AddEnableAccounts(session.Username, request.AddressList, request.Origin, request.Network)
	if sErr != nil {
		http_common.SendErrorResponse(w, *sErr)
	}

	http_common.SendSuccessResponse(w, map[string]interface{}{"success": true})

}
