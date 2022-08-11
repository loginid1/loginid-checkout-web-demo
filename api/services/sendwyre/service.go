package sendwyre

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io/ioutil"
	"net"
	"net/http"
	"time"

	"gitlab.com/loginid/software/libraries/goutil.git/logger"
	"gitlab.com/loginid/software/services/loginid-vault/services"
)

type SendWyreService struct {
	client          *http.Client
	baseURL         string
	accountID       string
	apiSecret       string
	redirectBaseUrl string
}

func NewSendWyreService(accountID string, apiSecret string, baseURL string, redirectBaseUrl string) (*SendWyreService, error) {

	if accountID == "" || apiSecret == "" || baseURL == "" || redirectBaseUrl == "" {
		return nil, errors.New("sendwyre env not initialized")
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

	return &SendWyreService{client: client, baseURL: baseURL, accountID: accountID, apiSecret: apiSecret, redirectBaseUrl: redirectBaseUrl}, nil
}

type OrderInitResponse struct {
	Url         string `json:"url"`
	Reservation string `json:"reservation"`
}

// return byte for now
//TODO: may need to map to object to intercept attestation options

func (s *SendWyreService) OrderInit(username string, address string, redirectUrl string) (*OrderInitResponse, *services.ServiceError) {

	dest := fmt.Sprintf("%s:%s", "algorand", address)
	auto := "false"
	if redirectUrl != "" {
		auto = "true"
	}
	request := map[string]string{
		"referrerAccountId": s.accountID,
		"dest":              dest,
		"destCurrency":      "ALGO",
		"autoRedirect":      auto,
		"redirectUrl":       redirectUrl,
		//"failureRedirectUrl": redirectUrl,
	}

	data, err := json.Marshal(request)
	if err != nil {
		return nil, &services.ServiceError{Message: "order reservation failed"}
	}

	response, err := s.post("v3/orders/reserve", data)
	if err != nil {
		return nil, &services.ServiceError{Message: "order reservation failed"}
	}

	// handle response
	defer response.Body.Close()
	respBody, err := ioutil.ReadAll(response.Body)
	if err != nil {
		return nil, &services.ServiceError{Message: "order reservation failed"}
	}

	if response.StatusCode != http.StatusOK {
		msg := decodeError(respBody)
		logger.Global.Error(string(respBody))
		return nil, &services.ServiceError{Message: msg.Message}
	}
	var orderResp OrderInitResponse
	err = json.Unmarshal(respBody, &orderResp)
	if err != nil {
		return nil, &services.ServiceError{Message: "order reservation failed"}
	}
	return &orderResp, nil
}

// post http util function
func (s *SendWyreService) post(path string, body []byte) (*http.Response, error) {

	request, err := http.NewRequest("POST", fmt.Sprintf("%s/%s", s.baseURL, path), bytes.NewBuffer(body))
	request.Header.Set("Content-type", "application/json")
	request.Header.Set("Authorization", fmt.Sprintf("bearer %s", s.apiSecret))
	if err != nil {
		return nil, err
	}
	resp, err := s.client.Do(request)

	if err != nil {
		return nil, err
	}
	return resp, nil
}

type ErrorMessage struct {
	ExceptionId string `json:"exceptionId"`
	ErrorCode   string `json:"errorCode"`
	Message     string `json:"message"`
	Type        string `json:"type"`
	Language    string `json:"language"`
}

func decodeError(body []byte) ErrorMessage {
	var eMesg ErrorMessage
	json.Unmarshal(body, &eMesg)
	return eMesg
}
