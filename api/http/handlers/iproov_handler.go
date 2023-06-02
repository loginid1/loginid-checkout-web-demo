package handlers

import (
	"io/ioutil"
	"net/http"

	"github.com/google/uuid"
	"github.com/gorilla/mux"
	"gitlab.com/loginid/software/libraries/goutil.git"
	http_common "gitlab.com/loginid/software/services/loginid-vault/http/common"
	"gitlab.com/loginid/software/services/loginid-vault/services"
	"gitlab.com/loginid/software/services/loginid-vault/services/iproov"
	"gitlab.com/loginid/software/services/loginid-vault/services/user"
)

var CorsOrigins = goutil.GetEnv("CORS_ORIGINS", "http://localhost:3000,http://localhost:3010")

type IProovHandler struct {
	IProovService *iproov.IProovService
	UserService   *user.UserService
}

func (h *IProovHandler) EnrolmentToken(w http.ResponseWriter, r *http.Request) {
	credentialId := uuid.NewString()

	// Parse our multipart form, 10 << 20 specifies a maximum
	// upload of 10 MB files.
	r.ParseMultipartForm(10 << 20)

	// FormFile returns the first file for the given key `myFile`
	// it also returns the FileHeader so we can get the Filename,
	// the Header and the size of the file
	file, _, err := r.FormFile("file")
	if err != nil {
		http_common.SendErrorResponse(w, services.NewError(err.Error()))
		return
	}
	defer file.Close()

	enrolTokenResponse, sErr := h.IProovService.ClaimEnrolmentToken(r.Context(), credentialId, CorsOrigins)
	if sErr != nil {
		http_common.SendErrorResponse(w, *sErr)
		return
	}

	// Read all of the contents of our uploaded file into a byte array
	fileBytes, err := ioutil.ReadAll(file)
	if err != nil {
		http_common.SendErrorResponse(w, services.NewError(err.Error()))
		return
	}

	if _, sErr := h.IProovService.ClaimEnrolmentImage(r.Context(), enrolTokenResponse.Token, fileBytes); sErr != nil {
		http_common.SendErrorResponse(w, *sErr)
		return
	}

	verifyTokenRespnse, sErr := h.IProovService.ClaimVerifyToken(r.Context(), credentialId, CorsOrigins)
	if sErr != nil {
		http_common.SendErrorResponse(w, *sErr)
		return
	}

	response := iproov.TokenResponse{
		CredentialId: credentialId,
		BaseURL:      iproov.BaseURL,
		Token:        verifyTokenRespnse.Token,
	}
	http_common.SendSuccessResponse(w, response)
}

func (h *IProovHandler) VerificationToken(w http.ResponseWriter, r *http.Request) {
	pathParams := mux.Vars(r)
	credentialId := pathParams["credential_id"]

	verifyTokenRespnse, sErr := h.IProovService.ClaimVerifyToken(r.Context(), credentialId, CorsOrigins)
	if sErr != nil {
		http_common.SendErrorResponse(w, *sErr)
		return
	}

	response := iproov.TokenResponse{
		CredentialId: credentialId,
		BaseURL:      iproov.BaseURL,
		Token:        verifyTokenRespnse.Token,
	}
	http_common.SendSuccessResponse(w, response)
}
