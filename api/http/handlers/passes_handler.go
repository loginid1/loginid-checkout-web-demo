package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	"github.com/go-playground/validator/v10"
	"github.com/gorilla/mux"
	http_common "gitlab.com/loginid/software/services/loginid-vault/http/common"
	"gitlab.com/loginid/software/services/loginid-vault/services"
	"gitlab.com/loginid/software/services/loginid-vault/services/iproov"
	"gitlab.com/loginid/software/services/loginid-vault/services/pass"
	"gitlab.com/loginid/software/services/loginid-vault/services/user"
)

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
	Data         pass.DriversLicensePass `json:"data" validate:"required"`
	IproovToken  string                  `json:"iproov_token" validate:"required"`
	CredentialId string                  `json:"credential_id" validate:"required"`
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
