package fido2

import (
	"bytes"
	"crypto/ecdsa"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"io/ioutil"
	"net"
	"net/http"
	"time"

	"gitlab.com/loginid/software/services/loginid-vault/services"
	"gitlab.com/loginid/software/services/loginid-vault/utils"
)

type Fido2Service struct {
	client      *http.Client
	baseURL     string
	clientID    string
	apiClientID string
	apiKey      *ecdsa.PrivateKey
}

type FidoResponse struct {
	Jwt     string `json:"jwt"`
	Success bool   `json:"success"`
}

func NewFido2Service(clientID string, baseURL string, apiClientID string, apiPem string) (*Fido2Service, error) {
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

	decoded, err := base64.StdEncoding.DecodeString(apiPem)
	if err != nil {
		return nil, errors.New("failed to decoded pem")
	}
	apiKey, err := utils.LoadPrivateKeyFromPEM(decoded)
	if err != nil {
		return nil, errors.New("failed to extract key from pem")
	}

	return &Fido2Service{client: fido2Client, baseURL: baseURL, clientID: clientID, apiClientID: apiClientID, apiKey: apiKey}, nil
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

	token, err := utils.GenerateLoginApiTokenByUsername(f.apiKey, "auth.register", username, "")
	if err != nil {
		return nil, &services.ServiceError{Message: "device registration permission error"}
	}
	response, err := f.post("register/fido2/init", data, token)
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

	response, err := f.post("register/fido2/complete", data, "")
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

	token, err := utils.GenerateLoginApiTokenByUsername(f.apiKey, "auth.login", username, "")
	if err != nil {
		return nil, &services.ServiceError{Message: "authentication request permission error"}
	}
	response, err := f.post("authenticate/fido2/init", data, token)
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

	response, err := f.post("authenticate/fido2/complete", data, "")
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

func (f *Fido2Service) TransactionInit(username string, tx_payload string, tx_nonce string) ([]byte, *services.ServiceError) {

	request := map[string]string{
		"client_id":  f.clientID,
		"username":   username,
		"tx_type":    "text",
		"tx_payload": tx_payload,
		"nonce":      tx_nonce,
	}

	data, err := json.Marshal(request)
	if err != nil {
		return nil, &services.ServiceError{Message: "transaction request binding error"}
	}

	token, err := utils.GenerateLoginApiTokenByUsername(f.apiKey, "tx.create", username, tx_payload)
	if err != nil {
		return nil, &services.ServiceError{Message: "transaction request permission error"}
	}
	response, err := f.post("api/tx/init", data, token)
	if err != nil {
		return nil, &services.ServiceError{Message: "transaction error"}
	}

	// handle response
	defer response.Body.Close()
	respBody, err := ioutil.ReadAll(response.Body)
	if err != nil {
		return nil, &services.ServiceError{Message: "transaction error"}
	}

	if response.StatusCode != http.StatusOK {
		msg := decodeError(respBody)
		return nil, &services.ServiceError{Message: msg.Message}
	}
	return respBody, nil
}

func (f *Fido2Service) TransactionComplete(username string, tx_id string, credential_id string, challenge string, authenticator_data string, client_data string, signature string) (*FidoResponse, *services.ServiceError) {

	/*
		assertion_payload := map[string]string{
			"credential_id":      credential_id,
			"challenge":          challenge,
			"authenticator_data": authenticator_data,
			"signature":          signature,
			"client_data":        client_data,
		}
	*/
	request := map[string]interface{}{
		"client_id":   f.clientID,
		"tx_id":       tx_id,
		"username":    username,
		"key_handle":  credential_id,
		"challenge":   challenge,
		"auth_data":   authenticator_data,
		"client_data": client_data,
		"sign_data":   signature,
	}

	//logger.Global.Debug(fmt.Sprintf("fido2: %#v", request))
	data, err := json.Marshal(request)
	if err != nil {
		return nil, &services.ServiceError{Message: "transaction request error"}
	}

	response, err := f.post("api/tx/complete", data, "")
	if err != nil {
		return nil, &services.ServiceError{Message: "transaction error"}
	}

	// handle response
	defer response.Body.Close()
	respBody, err := ioutil.ReadAll(response.Body)
	if err != nil {
		return nil, &services.ServiceError{Message: "transaction response error"}
	}

	if response.StatusCode != http.StatusOK {
		msg := decodeError(respBody)
		return nil, &services.ServiceError{Message: msg.Message}
	}
	var fresp FidoResponse
	err = json.Unmarshal(respBody, &fresp)
	if err != nil {
		return nil, &services.ServiceError{Message: "transaction response error"}
	}
	return &fresp, nil
}

func (f *Fido2Service) GenerateCode(userID string) ([]byte, *services.ServiceError) {

	request := map[string]interface{}{
		"client_id": f.apiClientID,
		"user_id":   userID,
		"purpose":   "add_credential",
		"authorize": true,
	}

	data, err := json.Marshal(request)
	if err != nil {
		return nil, &services.ServiceError{Message: "credential code generate error"}
	}

	token, err := utils.GenerateLoginApiTokenByUsername(f.apiKey, "codes.generate", userID, "")
	if err != nil {
		return nil, &services.ServiceError{Message: "credential code request permission error"}
	}
	response, err := f.post("codes/short/generate", data, token)
	if err != nil {
		return nil, &services.ServiceError{Message: "credential code generate error"}
	}

	// handle response
	defer response.Body.Close()
	respBody, err := ioutil.ReadAll(response.Body)
	if err != nil {
		return nil, &services.ServiceError{Message: "credential code response error"}
	}

	if response.StatusCode != http.StatusOK {
		msg := decodeError(respBody)
		return nil, &services.ServiceError{Message: msg.Message}
	}
	return respBody, nil
}

func (f *Fido2Service) AddCredentialInit(username string, code string) ([]byte, *services.ServiceError) {

	authentication_code := map[string]string{
		"code": code,
		"type": "short",
	}
	request := map[string]interface{}{
		"client_id":           f.clientID,
		"username":            username,
		"authentication_code": authentication_code,
	}

	data, err := json.Marshal(request)
	if err != nil {
		return nil, &services.ServiceError{Message: "device registration failed"}
	}

	token, err := utils.GenerateLoginApiTokenByUsername(f.apiKey, "credentials.add", username, "")
	if err != nil {
		return nil, &services.ServiceError{Message: "device registration permission error"}
	}
	response, err := f.post("credentials/fido2/init/code", data, token)
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

func (f *Fido2Service) AddCredentialComplete(username string, credential_uuid string, credential_id string, challenge string, attestation_data string, client_data string) ([]byte, *services.ServiceError) {

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

	response, err := f.post("credentials/fido2/complete", data, "")
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

// post http util function
func (f *Fido2Service) post(path string, body []byte, token string) (*http.Response, error) {

	request, err := http.NewRequest("POST", fmt.Sprintf("%s/%s", f.baseURL, path), bytes.NewBuffer(body))
	if err != nil {
		return nil, err
	}
	request.Header.Set("Content-type", "application/json")
	if token != "" {
		request.Header.Set("Authorization", fmt.Sprintf("bearer %s", token))
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
