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

type DispenserHandler struct {
	AlgoService *algo.AlgoService
}

/**
EnableHandler - enable dapp & wallet integration
*/
func (h *DispenserHandler) DispenserHandler(w http.ResponseWriter, r *http.Request) {
	/*
		session, err := h.AuthService.ValidateSessionToken(r)
		if err != nil {
			http_common.SendErrorResponse(w, services.NewError("not authorized"))
			return
		}*/

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
