package http_common

import (
	"encoding/json"
	"net/http"

	"gitlab.com/loginid/software/libraries/goutil.git/logger"
	"gitlab.com/loginid/software/services/loginid-vault/services"
)

type ErrorResponse struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}

func SendErrorResponse(w http.ResponseWriter, error services.ServiceError) {

	jsonResponse, jsonError := json.Marshal(ErrorResponse{Code: "bad_request", Message: error.Message})

	if jsonError != nil {
		logger.Global.Error("failed to encode error json")
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusBadRequest)
	w.Write(jsonResponse)
}

func SendErrorResponseWithCode(w http.ResponseWriter, code string, message string) {

	jsonResponse, jsonError := json.Marshal(ErrorResponse{Code: code, Message: message})

	if jsonError != nil {
		logger.Global.Error("failed to encode error json")
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusBadRequest)
	w.Write(jsonResponse)
}

func SendSuccessResponse(w http.ResponseWriter, response interface{}) {

	jsonResponse, jsonError := json.Marshal(response)

	if jsonError != nil {
		logger.Global.Error("failed to encode success json")
	}
	w.Header().Set("Content-Type", "application/json")
	//w.WriteHeader(http.StatusOK)
	w.Write(jsonResponse)
}

func SendSuccessResponseRaw(w http.ResponseWriter, response []byte) {
	w.Header().Set("Content-Type", "application/json")
	w.Write(response)
}
