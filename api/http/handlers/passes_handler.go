package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/go-playground/validator/v10"
	"github.com/google/uuid"
	"github.com/gorilla/mux"
	"github.com/gorilla/websocket"
	"github.com/redis/go-redis/v9"
	"gitlab.com/loginid/software/libraries/goutil.git"
	http_common "gitlab.com/loginid/software/services/loginid-vault/http/common"
	"gitlab.com/loginid/software/services/loginid-vault/services"
	"gitlab.com/loginid/software/services/loginid-vault/services/iproov"
	"gitlab.com/loginid/software/services/loginid-vault/services/pass"
	"gitlab.com/loginid/software/services/loginid-vault/services/user"
	"gitlab.com/loginid/software/services/loginid-vault/utils"
)

var walletUrl = goutil.GetEnv("WALLET_BASEURL", "")

type PhoneInitRequest struct {
	PhoneNumber string `json:"phone_number" validate:"required,e164"`
}

func (r *PhoneInitRequest) validate() *services.ServiceError {
	// Store the validation errors that occurred
	errMap := map[string]string{}

	V := *validator.New()
	errs := V.Struct(r)
	if errs != nil {
		for _, err := range errs.(validator.ValidationErrors) {
			errField := err.Field()

			message := ""
			switch err.Tag() {
			case "required":
				message = fmt.Sprintf("'%s' is required", errField)
			case "e164":
				message = fmt.Sprintf("'%s' is not a valid phone number", errField)
			default:
				message = fmt.Sprintf("'%s' is invalid", errField)
			}
			errMap[errField] = message
		}
	}

	errMessages := []string{}
	for _, message := range errMap {
		errMessages = append(errMessages, message)
	}
	if len(errMessages) > 0 {
		return services.CreateError(strings.Join(errMessages, "; "))
	}

	return nil
}

type PhoneCompleteRequest struct {
	PassName    string `json:"pass_name" validate:"required"`
	PhoneNumber string `json:"phone_number" validate:"required,e164"`
	Code        string `json:"code" validate:"required"`
}

func (r *PhoneCompleteRequest) validate() *services.ServiceError {
	// Store the validation errors that occurred
	errMap := map[string]string{}

	V := *validator.New()
	errs := V.Struct(r)
	if errs != nil {
		for _, err := range errs.(validator.ValidationErrors) {
			errField := err.Field()

			message := ""
			switch err.Tag() {
			case "required":
				message = fmt.Sprintf("'%s' is required", errField)
			case "e164":
				message = fmt.Sprintf("'%s' is not a valid phone number", errField)
			default:
				message = fmt.Sprintf("'%s' is invalid", errField)
			}
			errMap[errField] = message
		}
	}

	errMessages := []string{}
	for _, message := range errMap {
		errMessages = append(errMessages, message)
	}
	if len(errMessages) > 0 {
		return services.CreateError(strings.Join(errMessages, "; "))
	}

	return nil
}

type DriversLicenseRequest struct {
	PassName     string                  `json:"pass_name" validate:"required"`
	IproovToken  string                  `json:"iproov_token" validate:"required"`
	CredentialId string                  `json:"credential_id" validate:"required"`
	Data         pass.DriversLicensePass `json:"data" validate:"required"`
}

func (r *DriversLicenseRequest) validate() *services.ServiceError {
	// Store the validation errors that occurred
	errMap := map[string]string{}

	V := *validator.New()
	errs := V.Struct(r)
	if errs != nil {
		for _, err := range errs.(validator.ValidationErrors) {
			errField := err.Field()

			message := ""
			switch err.Tag() {
			case "required":
				message = fmt.Sprintf("'%s' is required", errField)
			default:
				message = fmt.Sprintf("'%s' is invalid", errField)
			}
			errMap[errField] = message
		}
	}

	errMessages := []string{}
	for _, message := range errMap {
		errMessages = append(errMessages, message)
	}
	if len(errMessages) > 0 {
		return services.CreateError(strings.Join(errMessages, "; "))
	}

	return nil
}

type PassesHandler struct {
	PassService   *pass.PassService
	IProovService *iproov.IProovService
	UserService   *user.UserService
	RedisClient   *redis.Client
}

func (h *PassesHandler) List(w http.ResponseWriter, r *http.Request) {
	session := r.Context().Value("session").(services.UserSession)

	passes, err := h.PassService.List(r.Context(), session.Username)
	if err != nil {
		http_common.SendErrorResponse(w, *err)
		return
	}

	http_common.SendSuccessResponse(w, passes)
}

func (h *PassesHandler) Delete(w http.ResponseWriter, r *http.Request) {
	pathParams := mux.Vars(r)

	id := pathParams["id"]
	if id == "" {
		http_common.SendErrorResponse(w, services.NewError("Missing pass ID"))
		return
	}

	if err := h.PassService.Delete(r.Context(), id); err != nil {
		http_common.SendErrorResponse(w, *err)
		return
	}

	http_common.SendSuccess(w)
}

func (h *PassesHandler) PhoneInit(w http.ResponseWriter, r *http.Request) {
	var request PhoneInitRequest
	defer r.Body.Close()
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		http_common.SendErrorResponse(w, services.NewError("failed to parse request"))
		return
	}

	if err := request.validate(); err != nil {
		http_common.SendErrorResponse(w, *err)
		return
	}

	session := r.Context().Value("session").(services.UserSession)

	if err := h.PassService.PhoneInit(r.Context(), session.Username, request.PhoneNumber); err != nil {
		http_common.SendErrorResponse(w, *err)
		return
	}

	http_common.SendSuccess(w)
}

func (h *PassesHandler) PhoneComplete(w http.ResponseWriter, r *http.Request) {
	var request PhoneCompleteRequest
	defer r.Body.Close()
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		http_common.SendErrorResponse(w, services.NewError("failed to parse request"))
		return
	}

	if err := request.validate(); err != nil {
		http_common.SendErrorResponse(w, *err)
		return
	}

	session := r.Context().Value("session").(services.UserSession)
	if err := h.PassService.PhoneComplete(r.Context(), session.Username, request.PassName, request.PhoneNumber, request.Code); err != nil {
		http_common.SendErrorResponse(w, *err)
		return
	}

	http_common.SendSuccess(w)
}

func (h *PassesHandler) DriversLicense(w http.ResponseWriter, r *http.Request) {
	var request DriversLicenseRequest
	defer r.Body.Close()
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		http_common.SendErrorResponse(w, services.NewError("failed to parse request"))
		return
	}

	if err := request.validate(); err != nil {
		http_common.SendErrorResponse(w, *err)
		return
	}

	session := r.Context().Value("session").(services.UserSession)
	usr, err := h.UserService.GetUser(session.Username)
	if err != nil {
		http_common.SendErrorResponse(w, *err)
		return
	}

	result, err := h.IProovService.ClaimVerifyValidate(r.Context(), request.CredentialId, request.IproovToken, r.UserAgent())
	if err != nil {
		http_common.SendErrorResponse(w, *err)
		return
	}
	if !result.Passed {
		http_common.SendErrorResponse(w, services.NewError("facial matching with the document did not pass"))
		return
	}

	if err := h.PassService.AddDriversLicensePass(r.Context(), usr.ID, request.CredentialId, request.PassName, request.Data); err != nil {
		http_common.SendErrorResponse(w, *err)
		return
	}

	http_common.SendSuccess(w)
}

type DriversLicenseMobileInitResponse struct {
	SessionId string `json:"session_id"`
	Link      string `json:"link"`
	QRCode    string `json:"qr_code"`
}

type DriversLicenseMobileInitRequest struct {
	PassName string `json:"pass_name"`
	PassType string `json:"pass_type"`
}

type DriversLicenseMobileSession struct {
	PassName            string `json:"pass_name"`
	PassType            string `json:"pass_type"`
	AuthenticationToken string `json:"authentication_token"`
}

func (h *PassesHandler) DriversLicenseMobileInit(w http.ResponseWriter, r *http.Request) {
	var request DriversLicenseMobileInitRequest
	defer r.Body.Close()
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		http_common.SendErrorResponse(w, services.NewError("failed to parse request"))
		return
	}

	sessionId := uuid.NewString()

	data := DriversLicenseMobileSession{
		PassName:            request.PassName,
		PassType:            request.PassType,
		AuthenticationToken: r.Header.Get("x-session-token"),
	}
	dataBytes, _ := json.Marshal(data)
	h.RedisClient.Set(r.Context(), sessionId, dataBytes, 6*time.Minute)

	link := fmt.Sprintf("%s/passes/new/drivers-license/mobile/%s", walletUrl, sessionId)

	qrcode, err := utils.GenerateQRCode(link)
	if err != nil {
		http_common.SendErrorResponse(w, services.NewError("fail to generate qr code"))
		return
	}
	http_common.SendSuccessResponse(w, DriversLicenseMobileInitResponse{
		SessionId: sessionId,
		Link:      link,
		QRCode:    qrcode,
	})
}

func (h *PassesHandler) DriversLicenseMobileVerify(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	sessionId := vars["session"]
	if sessionId == "" {
		return
	}

	dataBytes, err := h.RedisClient.Get(r.Context(), sessionId).Bytes()
	if err != nil {
		http_common.SendErrorResponse(w, services.NewError("fail to verify session"))
		return
	}
	var data DriversLicenseMobileSession
	if err := json.Unmarshal(dataBytes, &data); err != nil {
		http_common.SendErrorResponse(w, services.NewError("fail to verify session"))
		return
	}

	// update mobile session to begin
	if err := h.RedisClient.Publish(r.Context(), sessionId, "session.begin").Err(); err != nil {
		log.Println(err)
		http_common.SendErrorResponse(w, services.NewError("fail to update session channel"))
		return
	}

	http_common.SendSuccessResponse(w, data)
}

func (h *PassesHandler) DriversLicenseMobileCancel(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	sessionId := vars["session"]
	if sessionId == "" {
		return
	}

	_, err := h.RedisClient.Get(r.Context(), sessionId).Bytes()
	if err != nil {
		http_common.SendErrorResponse(w, services.NewError("fail to verify session"))
		return
	}

	// update mobile session to begin
	if err := h.RedisClient.Publish(r.Context(), sessionId, "session.cancel").Err(); err != nil {
		log.Println(err)
		http_common.SendErrorResponse(w, services.NewError("fail to update session channel"))
		return
	}

	http_common.SendSuccess(w)
}

type DriversLicenseCompleteRequest struct {
	IproovToken  string                  `json:"iproov_token" validate:"required"`
	CredentialId string                  `json:"credential_id" validate:"required"`
	Data         pass.DriversLicensePass `json:"data" validate:"required"`
}

func (r *DriversLicenseCompleteRequest) validate() *services.ServiceError {
	// Store the validation errors that occurred
	errMap := map[string]string{}

	V := *validator.New()
	errs := V.Struct(r)
	if errs != nil {
		for _, err := range errs.(validator.ValidationErrors) {
			errField := err.Field()

			message := ""
			switch err.Tag() {
			case "required":
				message = fmt.Sprintf("'%s' is required", errField)
			default:
				message = fmt.Sprintf("'%s' is invalid", errField)
			}
			errMap[errField] = message
		}
	}

	errMessages := []string{}
	for _, message := range errMap {
		errMessages = append(errMessages, message)
	}
	if len(errMessages) > 0 {
		return services.CreateError(strings.Join(errMessages, "; "))
	}

	return nil
}

func (h *PassesHandler) DriversLicenseMobileComplete(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	sessionId := vars["session"]
	if sessionId == "" {
		return
	}

	var request DriversLicenseCompleteRequest
	defer r.Body.Close()
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		http_common.SendErrorResponse(w, services.NewError("failed to parse request"))
		return
	}

	if err := request.validate(); err != nil {
		http_common.SendErrorResponse(w, *err)
		return
	}

	dataBytes, goErr := h.RedisClient.Get(r.Context(), sessionId).Bytes()
	if goErr != nil {
		http_common.SendErrorResponse(w, services.NewError("fail to verify session"))
		return
	}
	var data DriversLicenseMobileSession
	if err := json.Unmarshal(dataBytes, &data); err != nil {
		http_common.SendErrorResponse(w, services.NewError("fail to verify session"))
		return
	}

	session := r.Context().Value("session").(services.UserSession)
	usr, err := h.UserService.GetUser(session.Username)
	if err != nil {
		http_common.SendErrorResponse(w, *err)
		return
	}

	result, err := h.IProovService.ClaimVerifyValidate(r.Context(), request.CredentialId, request.IproovToken, r.UserAgent())
	if err != nil {
		http_common.SendErrorResponse(w, *err)
		return
	}
	if !result.Passed {
		http_common.SendErrorResponse(w, services.NewError("facial matching with the document did not pass"))
		return
	}

	if err := h.PassService.AddDriversLicensePass(r.Context(), usr.ID, request.CredentialId, data.PassName, request.Data); err != nil {
		http_common.SendErrorResponse(w, *err)
		return
	}

	if err := h.RedisClient.Publish(r.Context(), sessionId, "session.success").Err(); err != nil {
		//log.Println(err)
		http_common.SendErrorResponse(w, services.NewError("fail to update session channel"))
		return
	}

	http_common.SendSuccess(w)
}

type DriversLicenseMessage struct {
	pass.DriversLicensePass
}

func (h *PassesHandler) DriversLicenseMobileWS(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	sessionId := vars["session"]
	if sessionId == "" {
		return
	}

	ws, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("upgrader:", err)
		return
	}
	defer ws.Close()

	ctx := context.Background()
	outSub := h.RedisClient.Subscribe(ctx, sessionId)

	// Close the subscription when we are done.
	defer outSub.Close()
	ch := outSub.Channel()

	for msg := range ch {
		log.Println(msg.Channel, msg.Payload)
		ws.WriteMessage(websocket.TextMessage, []byte(msg.Payload))
	}
}
