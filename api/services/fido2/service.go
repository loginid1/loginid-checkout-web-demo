package fido2

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net"
	"net/http"
	"time"

	"gitlab.com/loginid/software/services/loginid-vault/services"
)

type Fido2Service struct {
	client   *http.Client
	baseURL  string
	clientID string
}

func NewFido2Service(clientID string, baseURL string) *Fido2Service {
	var netTransport = &http.Transport{
		Dial: (&net.Dialer{
			Timeout: 10 * time.Second,
		}).Dial,
		TLSHandshakeTimeout: 10 * time.Second,
	}
	var fido2Client = &http.Client{
		Timeout:   time.Second * 30,
		Transport: netTransport,
	}
	return &Fido2Service{client: fido2Client, baseURL: baseURL, clientID: clientID}
}

// return byte for now
//TODO: may need to map to object to intercept attestation options

func (f *Fido2Service) RegisterInit(username string) ([]byte, *services.ServiceError) {

	request := map[string]string{
		"client_id": f.clientID,
		"username":  username,
	}

	data, err := json.Marshal(request)
	if err != nil {
		return nil, &services.ServiceError{Message: "device registration failed"}
	}

	response, err := f.post("register/fido2/init", data)
	if err != nil {
		return nil, &services.ServiceError{Message: "device registration failed"}
	}

	// handle response
	defer response.Body.Close()
	respBody, err := ioutil.ReadAll(response.Body)
	if err != nil {
		return nil, &services.ServiceError{Message: "device registration failed"}
	}

	if response.StatusCode != http.StatusOK {
		msg := decodeError(respBody)
		return nil, &services.ServiceError{Message: msg.Message}
	}
	return respBody, nil
}

func (f *Fido2Service) RegisterComplete(username string, credential_uuid string, credential_id string, challenge string, attestation_data string, client_data string) ([]byte, *services.ServiceError) {

	attestation_payload := map[string]string{
		"credential_id":    credential_id,
		"credential_uuid":  credential_uuid,
		"challenge":        challenge,
		"attestation_data": attestation_data,
		"client_data":      client_data,
	}

	request := map[string]interface{}{
		"client_id":           f.clientID,
		"username":            username,
		"attestation_payload": attestation_payload,
	}

	data, err := json.Marshal(request)
	if err != nil {
		return nil, &services.ServiceError{Message: "device registration failed"}
	}

	response, err := f.post("register/fido2/complete", data)
	if err != nil {
		return nil, &services.ServiceError{Message: "device registration failed"}
	}

	// handle response
	defer response.Body.Close()
	respBody, err := ioutil.ReadAll(response.Body)
	if err != nil {
		return nil, &services.ServiceError{Message: "device registration failed"}
	}

	if response.StatusCode != http.StatusOK {
		msg := decodeError(respBody)
		return nil, &services.ServiceError{Message: msg.Message}
	}
	return respBody, nil
}

func (f *Fido2Service) AuthenticateInit(username string) ([]byte, *services.ServiceError) {

	request := map[string]string{
		"client_id": f.clientID,
		"username":  username,
	}

	data, err := json.Marshal(request)
	if err != nil {
		return nil, &services.ServiceError{Message: "authentication request binding error"}
	}

	response, err := f.post("authenticate/fido2/init", data)
	if err != nil {
		return nil, &services.ServiceError{Message: "authentication error"}
	}

	// handle response
	defer response.Body.Close()
	respBody, err := ioutil.ReadAll(response.Body)
	if err != nil {
		return nil, &services.ServiceError{Message: "authentication error"}
	}

	if response.StatusCode != http.StatusOK {
		msg := decodeError(respBody)
		return nil, &services.ServiceError{Message: msg.Message}
	}
	return respBody, nil
}

func (f *Fido2Service) AuthenticateComplete(username string, credential_id string, challenge string, authenticator_data string, client_data string, signature string) ([]byte, *services.ServiceError) {

	assertion_payload := map[string]string{
		"credential_id":      credential_id,
		"challenge":          challenge,
		"authenticator_data": authenticator_data,
		"signature":          signature,
		"client_data":        client_data,
	}

	request := map[string]interface{}{
		"client_id":         f.clientID,
		"username":          username,
		"assertion_payload": assertion_payload,
	}

	//logger.Global.Debug(fmt.Sprintf("fido2: %#v", request))
	data, err := json.Marshal(request)
	if err != nil {
		return nil, &services.ServiceError{Message: "authentication request error"}
	}

	response, err := f.post("authenticate/fido2/complete", data)
	if err != nil {
		return nil, &services.ServiceError{Message: "authentication error"}
	}

	// handle response
	defer response.Body.Close()
	respBody, err := ioutil.ReadAll(response.Body)
	if err != nil {
		return nil, &services.ServiceError{Message: "authentication response error"}
	}

	if response.StatusCode != http.StatusOK {
		msg := decodeError(respBody)
		return nil, &services.ServiceError{Message: msg.Message}
	}
	return respBody, nil
}

// post http util function
func (f *Fido2Service) post(path string, body []byte) (*http.Response, error) {

	request, err := http.NewRequest("POST", fmt.Sprintf("%s/%s", f.baseURL, path), bytes.NewBuffer(body))
	request.Header.Set("Content-type", "application/json")
	if err != nil {
		return nil, err
	}
	resp, err := f.client.Do(request)

	if err != nil {
		return nil, err
	}
	return resp, nil
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
