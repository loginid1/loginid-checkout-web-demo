package handlers

import (
	"encoding/json"
	"net/http"

	http_common "gitlab.com/loginid/software/services/loginid-vault/http/common"
	"gitlab.com/loginid/software/services/loginid-vault/services"
	"gitlab.com/loginid/software/services/loginid-vault/services/algo"
)

type DispenserRequest struct {
	Address string `json:"address"`
	Origin  string `json:"origin"`
}

type DispenserResponse struct {
	Address string `json:"address"`
	Amount  uint64 `json:"amount"`
}

type DispenserSignRequest struct {
	Txn string `json:"txn"`
}

type DispenserSignResponse struct {
	Stxn string `json:"stxn"`
}

type DispenserPostRequest struct {
	Stxn []string `json:"stxn"`
}

type DispenserPostResponse struct {
	Id string
}

type DispenserHandler struct {
	AlgoService *algo.AlgoService
}

/**
DispenserDepositHandler - enable dapp & wallet integration
*/
func (h *DispenserHandler) DispenserDepositHandler(w http.ResponseWriter, r *http.Request) {

	authHeader := r.Header.Get("x-api-token")
	if authHeader != "" {
		if authHeader != "loginid-dispenser" {
			http_common.SendErrorResponse(w, services.NewError("not authorized"))
			return
		}
	} else {
		http_common.SendErrorResponse(w, services.NewError("not authorized"))
		return
	}
	var request DispenserRequest
	defer r.Body.Close()
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		http_common.SendErrorResponse(w, services.NewError("failed to parse request"))
		return
	}

	// create enable accounts

	amount, sErr := h.AlgoService.SandnetDispenser(request.Address)
	if sErr != nil {
		http_common.SendErrorResponse(w, *sErr)
		return
	}

	http_common.SendSuccessResponse(w, DispenserResponse{Address: request.Address, Amount: amount})

}

func (h *DispenserHandler) DispenserSignHandler(w http.ResponseWriter, r *http.Request) {

	authHeader := r.Header.Get("x-api-token")
	if authHeader != "" {
		if authHeader != "loginid-dispenser" {
			http_common.SendErrorResponse(w, services.NewError("not authorized"))
			return
		}
	} else {
		http_common.SendErrorResponse(w, services.NewError("not authorized"))
		return
	}
	var request DispenserSignRequest
	defer r.Body.Close()
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		http_common.SendErrorResponse(w, services.NewError("failed to parse request"))
		return
	}

	// create enable accounts

	stxn, sErr := h.AlgoService.SandnetDispenserSign(request.Txn)
	if sErr != nil {
		http_common.SendErrorResponse(w, *sErr)
		return
	}

	http_common.SendSuccessResponse(w, DispenserSignResponse{Stxn: stxn})

}

func (h *DispenserHandler) DispenserPostHandler(w http.ResponseWriter, r *http.Request) {

	authHeader := r.Header.Get("x-api-token")
	if authHeader != "" {
		if authHeader != "loginid-dispenser" {
			http_common.SendErrorResponse(w, services.NewError("not authorized"))
			return
		}
	} else {
		http_common.SendErrorResponse(w, services.NewError("not authorized"))
		return
	}
	var request DispenserPostRequest
	defer r.Body.Close()
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		http_common.SendErrorResponse(w, services.NewError("failed to parse request"))
		return
	}

	// create enable accounts

	stxn, sErr := h.AlgoService.SandnetDispenserPost(request.Stxn)
	if sErr != nil {
		http_common.SendErrorResponse(w, *sErr)
		return
	}

	http_common.SendSuccessResponse(w, DispenserPostResponse{Id: stxn})

}
