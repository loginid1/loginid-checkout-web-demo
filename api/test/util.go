package test

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net"
	"net/http"
	"time"
)

type RestClient struct {
	client  *http.Client
	baseURL string
}

func NewRestClient(baseURL string) *RestClient {
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
	return &RestClient{client: client, baseURL: baseURL}
}

// post http util function
func (c *RestClient) Post(path string, data interface{}, token string) (*http.Response, error) {

	// serialize body
	body, err := json.Marshal(data)
	if err != nil {
		return nil, err
	}

	request, err := http.NewRequest("POST", fmt.Sprintf("%s/%s", c.baseURL, path), bytes.NewBuffer(body))
	if err != nil {
		return nil, err
	}
	request.Header.Set("Content-type", "application/json")
	if token != "" {
		request.Header.Set("x-session-token", fmt.Sprintf("bearer %s", token))
	}
	response, err := c.client.Do(request)

	if err != nil {
		return nil, err
	}
	return response, nil

}

func HandleResponse(response *http.Response) ([]byte, *ErrorMessage) {

	// handle response
	defer response.Body.Close()
	respBody, err := ioutil.ReadAll(response.Body)
	if err != nil {
		return nil, &ErrorMessage{Code: "client_error", Message: "parse response error"}
	}

	if response.StatusCode != http.StatusOK {
		msg := decodeError(respBody)
		return nil, &msg
	}
	return respBody, nil
}

type ErrorMessage struct {
	Code    string
	Message string
}

func decodeError(body []byte) ErrorMessage {
	var eMesg ErrorMessage
	json.Unmarshal(body, &eMesg)
	return eMesg
}
