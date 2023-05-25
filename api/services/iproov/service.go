package iproov

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"io/ioutil"
	"log"
	"mime/multipart"
	"net"
	"net/http"
	"time"

	"gitlab.com/loginid/software/libraries/goutil.git"
	"gitlab.com/loginid/software/libraries/goutil.git/logger"
	"gitlab.com/loginid/software/services/loginid-vault/services"
	"gorm.io/gorm"
)

var (
	BaseURL = goutil.GetEnv("IPROOV_BASE_URL", "https://us.rp.secure.iproov.me")
	ApiKey  = goutil.GetEnv("IPROOV_API_KEY", "")
	Secret  = goutil.GetEnv("IPROOV_API_SECRET", "")
)

type IProovService struct {
	client *http.Client
}

func NewIProovService(db *gorm.DB) (*IProovService, error) {
	if BaseURL == "" || ApiKey == "" || Secret == "" {
		return nil, errors.New("iProov env not initialized")
	}
	var netTransport = &http.Transport{
		Dial: (&net.Dialer{
			Timeout: 10 * time.Second,
		}).Dial,
		TLSHandshakeTimeout: 10 * time.Second,
	}
	var client = &http.Client{
		Timeout:   time.Second * 30,
		Transport: netTransport,
	}

	return &IProovService{client: client}, nil
}

func (s *IProovService) ClaimEnrolmentToken(ctx context.Context, userId, resource string) (*EnrolmentTokenResponse, *services.ServiceError) {
	log.Println("ClaimEnrolmentToken: Init")
	request := EnrolmentTokenRequest{
		ApiKey:        ApiKey,
		Secret:        Secret,
		Resource:      resource,
		UserId:        userId,
		AssuranceType: GenuinePresence,
	}

	data, err := json.Marshal(request)
	if err != nil {
		return nil, &services.ServiceError{Message: "claim enrolment token failed"}
	}

	response, err := s.post("/api/v2/claim/enrol/token", data)
	if err != nil {
		return nil, &services.ServiceError{Message: "claim enrolment token failed"}
	}

	// handle response
	defer response.Body.Close()
	respBody, err := ioutil.ReadAll(response.Body)
	if err != nil {
		return nil, &services.ServiceError{Message: "claim enrolment token failed"}
	}

	if response.StatusCode != http.StatusOK {
		err := decodeError(response.StatusCode, respBody)
		logger.Global.Error(string(respBody))
		return nil, &services.ServiceError{Message: err.Description}
	}

	var enrolment EnrolmentTokenResponse
	if err := json.Unmarshal(respBody, &enrolment); err != nil {
		return nil, &services.ServiceError{Message: "claim enrolment token failed"}
	}
	log.Println("ClaimEnrolmentToken: Complete")
	return &enrolment, nil
}

func (s *IProovService) ClaimEnrolmentImage(ctx context.Context, token string, image []byte) (*EnrolmentImageResponse, *services.ServiceError) {
	log.Println("ClaimEnrolmentImage: Init")

	var buffer bytes.Buffer
	w := multipart.NewWriter(&buffer)

	formFile, err := w.CreateFormFile("image", "image.png")
	if err != nil {
		return nil, &services.ServiceError{Message: "claim enrolment image failed"}
	}
	if _, err := formFile.Write(image); err != nil {
		return nil, &services.ServiceError{Message: "claim enrolment image failed"}
	}
	if err := w.Close(); err != nil {
		return nil, &services.ServiceError{Message: "claim enrolment image failed"}
	}

	if err := w.WriteField("api_key", ApiKey); err != nil {
		return nil, &services.ServiceError{Message: "claim enrolment image failed"}
	}
	if err := w.WriteField("secret", Secret); err != nil {
		return nil, &services.ServiceError{Message: "claim enrolment image failed"}
	}
	if err := w.WriteField("rotation", "0"); err != nil {
		return nil, &services.ServiceError{Message: "claim enrolment image failed"}
	}
	if err := w.WriteField("token", token); err != nil {
		return nil, &services.ServiceError{Message: "claim enrolment image failed"}
	}
	if err := w.WriteField("source", string(ElectronicID)); err != nil {
		return nil, &services.ServiceError{Message: "claim enrolment image failed"}
	}

	request, err := http.NewRequest("POST", BaseURL+"/api/v2/claim/enrol/image", &buffer)
	request.Header.Set("Content-type", w.FormDataContentType())
	if err != nil {
		return nil, &services.ServiceError{Message: "claim enrolment image failed"}
	}

	response, err := s.client.Do(request)
	if err != nil {
		return nil, &services.ServiceError{Message: "claim enrolment image failed"}
	}

	// handle response
	defer response.Body.Close()
	respBody, err := ioutil.ReadAll(response.Body)
	if err != nil {
		return nil, &services.ServiceError{Message: "claim enrolment image failed"}
	}

	if response.StatusCode != http.StatusOK {
		err := decodeError(response.StatusCode, respBody)
		logger.Global.Error(string(respBody))
		return nil, &services.ServiceError{Message: err.Description}
	}

	var enrolment EnrolmentImageResponse
	if err := json.Unmarshal(respBody, &enrolment); err != nil {
		return nil, &services.ServiceError{Message: "claim enrolment image failed"}
	}
	log.Println("ClaimEnrolmentImage: Complete")
	return &enrolment, nil
}

func (s *IProovService) ClaimVerifyToken(ctx context.Context, userId, resource string) (*VerifyTokenResponse, *services.ServiceError) {
	log.Println("ClaimVerifyToken: Init")
	request := VerifyTokenRequest{
		ApiKey:        ApiKey,
		Secret:        Secret,
		Resource:      resource,
		UserId:        userId,
		AssuranceType: GenuinePresence,
	}

	data, err := json.Marshal(request)
	if err != nil {
		return nil, &services.ServiceError{Message: "claim verify token failed"}
	}

	response, err := s.post("/api/v2/claim/verify/token", data)
	if err != nil {
		return nil, &services.ServiceError{Message: "claim verify token failed"}
	}

	// handle response
	defer response.Body.Close()
	respBody, err := ioutil.ReadAll(response.Body)
	if err != nil {
		return nil, &services.ServiceError{Message: "claim verify token failed"}
	}

	if response.StatusCode != http.StatusOK {
		err := decodeError(response.StatusCode, respBody)
		logger.Global.Error(string(respBody))
		return nil, &services.ServiceError{Message: err.Description}
	}

	var verify VerifyTokenResponse
	if err := json.Unmarshal(respBody, &verify); err != nil {
		return nil, &services.ServiceError{Message: "claim verify token failed"}
	}
	log.Println("ClaimVerifyToken: Complete")
	return &verify, nil
}

func (s *IProovService) ClaimVerifyValidate(ctx context.Context, userId, token, client string) (*ValidateTokenResponse, *services.ServiceError) {
	log.Println("ClaimVerifyValidate: Init")
	request := ValidateTokenRequest{
		ApiKey: ApiKey,
		Secret: Secret,
		UserId: userId,
		Token:  token,
		Client: client,
	}

	data, err := json.Marshal(request)
	if err != nil {
		return nil, &services.ServiceError{Message: "claim verify token failed"}
	}

	response, err := s.post("/api/v2/claim/verify/validate", data)
	if err != nil {
		return nil, &services.ServiceError{Message: "claim verify token failed"}
	}

	// handle response
	defer response.Body.Close()
	respBody, err := ioutil.ReadAll(response.Body)
	if err != nil {
		return nil, &services.ServiceError{Message: "claim verify token failed"}
	}

	if response.StatusCode != http.StatusOK {
		err := decodeError(response.StatusCode, respBody)
		logger.Global.Error(string(respBody))
		return nil, &services.ServiceError{Message: err.Description}
	}

	var validate ValidateTokenResponse
	if err := json.Unmarshal(respBody, &validate); err != nil {
		return nil, &services.ServiceError{Message: "claim verify token failed"}
	}
	log.Println("ClaimVerifyValidate: Complete")
	return &validate, nil
}

func (s *IProovService) post(path string, body []byte) (*http.Response, error) {

	request, err := http.NewRequest("POST", BaseURL+path, bytes.NewBuffer(body))
	request.Header.Set("Content-type", "application/json")
	if err != nil {
		return nil, err
	}
	resp, err := s.client.Do(request)

	if err != nil {
		return nil, err
	}
	return resp, nil
}

func decodeError(code int, body []byte) ErrorResponse {
	var err ErrorResponse
	json.Unmarshal(body, &err)

	err.Code = code
	return err
}
