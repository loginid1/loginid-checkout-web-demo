package webflow

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"

	"gitlab.com/loginid/software/libraries/goutil.git/logger"
	"gitlab.com/loginid/software/services/loginid-vault/services"
)

type WebflowService struct {
	client       *http.Client
	BaseURL      string
	ApiBaseURL   string
	ClientID     string
	clientSecret string
}

func NewWebflowService(clientID string, clientSecret string, baseURL string, apiBaseURL string) *WebflowService {
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

	return &WebflowService{client: client, BaseURL: baseURL, ApiBaseURL: apiBaseURL, ClientID: clientID, clientSecret: clientSecret}
}

type WebflowTokenResponse struct {
	AccessToken string `json:"access_token"`
}

func (s *WebflowService) GetToken(code string) (string, *services.ServiceError) {

	path := fmt.Sprintf("%s/%s", s.ApiBaseURL, "/oauth/access_token")

	data := url.Values{}
	data.Set("code", code)
	data.Set("client_id", s.ClientID)
	data.Set("client_secret", s.clientSecret)
	data.Set("grant_type", "authorization_code")
	response, err := s.postForm(path, data, "")

	if err != nil {
		return "", &services.ServiceError{Message: "authorization failed"}
	}

	// handle response
	defer response.Body.Close()
	respBody, err := ioutil.ReadAll(response.Body)
	if err != nil {
		return "", &services.ServiceError{Message: "authorization failed"}
	}

	logger.Global.Info(string(respBody))
	if response.StatusCode != http.StatusOK {
		msg := decodeError(respBody)
		return "", &services.ServiceError{Message: msg.Error}
	}

	var token WebflowTokenResponse
	err = json.Unmarshal(respBody, &token)
	if err != nil {
		return "", &services.ServiceError{Message: "invalid token"}
	}

	return token.AccessToken, nil
}

func (s *WebflowService) GetSites(token string) (*WebflowSitesResult, *services.ServiceError) {

	path := fmt.Sprintf("%s/%s", s.ApiBaseURL, "beta/sites")

	response, err := s.get(path, token)

	if err != nil {
		return nil, &services.ServiceError{Message: "authorization failed"}
	}

	// handle response
	defer response.Body.Close()
	respBody, err := ioutil.ReadAll(response.Body)
	if err != nil {
		return nil, &services.ServiceError{Message: "authorization failed"}
	}

	logger.Global.Info(string(respBody))
	if response.StatusCode != http.StatusOK {
		msg := decodeError(respBody)
		return nil, &services.ServiceError{Message: msg.Error}
	}
	var sites WebflowSitesResult
	err = json.Unmarshal(respBody, &sites)
	if err != nil {
		return nil, &services.ServiceError{Message: "invalid sites"}
	}
	return &sites, nil
}

func (s *WebflowService) UploadScript(token string, siteId string, source string) (bool, *services.ServiceError) {
	scripts, err := s.RegisterScripts(token, siteId, source)
	if err != nil {
		return false, err
	}
	_, err = s.addScripts(token, siteId, scripts.RegisteredScripts)
	if err != nil {
		return false, err
	}

	/*
		for _, script := range scripts.RegisteredScripts {
			_, err := s.addScript(token, siteId, script)
			if err != nil {
				return false, err
			}
		}*/
	return true, nil

}

func (s *WebflowService) getRegisterScripts(token string, siteId string) (*WebflowRegisteredScriptsResult, *services.ServiceError) {

	get_path := fmt.Sprintf("%s/%s/%s/registered_scripts", s.ApiBaseURL, "beta/sites", siteId)
	response, err := s.get(get_path, token)
	if err != nil {
		return nil, &services.ServiceError{Message: "webflow network failure"}
	}
	// handle response
	defer response.Body.Close()
	respBody, err := ioutil.ReadAll(response.Body)
	if err != nil {
		return nil, &services.ServiceError{Message: "invalid response"}
	}

	logger.Global.Info(string(respBody))
	if response.StatusCode != http.StatusOK {
		msg := decodeApiError(respBody)
		return nil, &services.ServiceError{Message: msg.Message}
	}
	var result WebflowRegisteredScriptsResult
	err = json.Unmarshal(respBody, &result)
	if err != nil {
		return nil, &services.ServiceError{Message: "invalid site"}
	}
	return &result, nil

}

const INLINE_DEFAULT_VERSION = "1.0.4"
const SDK_DEFAULT_VERSION = "1.1.0"

func (s *WebflowService) RegisterScripts(token string, siteId string, source string) (*WebflowRegisteredScriptsResult, *services.ServiceError) {

	// get current registered script
	current_scripts, err := s.getRegisterScripts(token, siteId)
	if err != nil {
		return nil, err
	}

	// make sure script already

	sdk_script := searchScriptVersion(current_scripts.RegisteredScripts, "loginidwalletsdk", SDK_DEFAULT_VERSION)
	if sdk_script == nil {
		sdk_script, err = s.registerSDKScript(token, siteId)
		if err != nil {
			return nil, err
		}
	}

	inline_script := searchScript(current_scripts.RegisteredScripts, "loginidbuttonscript")
	if inline_script == nil {
		inline_script, err = s.registerInline(token, siteId, source, INLINE_DEFAULT_VERSION)
		if err != nil {
			return nil, err
		}
	} else {
		// increase version
		version := increaseVersion(inline_script.Version)

		inline_script, err = s.registerInline(token, siteId, source, version)
		if err != nil {
			return nil, err
		}
	}

	return &WebflowRegisteredScriptsResult{RegisteredScripts: []WebflowRegisteredScript{*sdk_script, *inline_script}}, nil
}

func (s *WebflowService) registerInline(token string, siteId string, source string, version string) (*WebflowRegisteredScript, *services.ServiceError) {
	path := fmt.Sprintf("%s/%s/%s/registered_scripts/inline", s.ApiBaseURL, "beta/sites", siteId)

	request := map[string]interface{}{
		"sourceCode":  source,
		"version":     version,
		"displayName": "LoginidButtonScript",
		"canCopy":     true,
	}

	data, err := json.Marshal(request)
	if err != nil {
		return nil, &services.ServiceError{Message: "authentication request error"}
	}
	response, err := s.post(path, data, token)

	if err != nil {
		return nil, &services.ServiceError{Message: "webflow network failure"}
	}

	// handle response
	defer response.Body.Close()
	respBody, err := ioutil.ReadAll(response.Body)
	if err != nil {
		return nil, &services.ServiceError{Message: "invalid response"}
	}

	logger.Global.Info(string(respBody))
	if response.StatusCode != http.StatusCreated {
		msg := decodeApiError(respBody)
		return nil, &services.ServiceError{Message: msg.Message}
	}
	var result WebflowRegisteredScript
	err = json.Unmarshal(respBody, &result)
	if err != nil {
		return nil, &services.ServiceError{Message: "invalid site"}
	}
	return &result, nil

}

func (s *WebflowService) registerSDKScript(token string, siteId string) (*WebflowRegisteredScript, *services.ServiceError) {

	path := fmt.Sprintf("%s/%s/%s/registered_scripts/hosted", s.ApiBaseURL, "beta/sites", siteId)

	request := map[string]interface{}{
		"version":        SDK_DEFAULT_VERSION,
		"displayName":    "LoginidWalletSDK",
		"canCopy":        true,
		"hostedLocation": "https://sdk-cdn.wallet.loginid.io/loginid-wallet-sdk.0.45.06-beta.min.js",
		"integrityHash":  "sha384-M8k1SpoWvXNsHai/rjetBM0/kxsuYqZYMyS2gbKejdgV1kD9BFf1o+5RIwdner/v",
	}

	data, err := json.Marshal(request)
	if err != nil {
		return nil, &services.ServiceError{Message: "authentication request error"}
	}
	response, err := s.post(path, data, token)

	if err != nil {
		return nil, &services.ServiceError{Message: "webflow network failure"}
	}

	// handle response
	defer response.Body.Close()
	respBody, err := ioutil.ReadAll(response.Body)
	if err != nil {
		return nil, &services.ServiceError{Message: "invalid response"}
	}

	logger.Global.Info(string(respBody))
	if response.StatusCode != http.StatusCreated {
		msg := decodeApiError(respBody)
		return nil, &services.ServiceError{Message: msg.Message}
	}
	var result WebflowRegisteredScript
	err = json.Unmarshal(respBody, &result)
	if err != nil {
		return nil, &services.ServiceError{Message: "invalid site"}
	}
	return &result, nil
}

func (s *WebflowService) DeleteScripts(token string, siteId string) (bool, *services.ServiceError) {

	path := fmt.Sprintf("%s/%s/%s/custom_code", s.ApiBaseURL, "beta/sites", siteId)

	response, err := s.send("DELETE", path, []byte{}, token)

	if err != nil {
		return false, &services.ServiceError{Message: "authorization failed"}
	}

	if response.StatusCode != http.StatusNoContent {
		// handle response
		defer response.Body.Close()
		respBody, err := ioutil.ReadAll(response.Body)
		if err != nil {
			return false, &services.ServiceError{Message: "authorization failed"}
		}
		msg := decodeApiError(respBody)
		return false, &services.ServiceError{Message: msg.Message}
	}
	return true, nil
}

func (s *WebflowService) addScripts(token string, siteId string, reg_scripts []WebflowRegisteredScript) (*WebflowAddScriptsResult, *services.ServiceError) {

	path := fmt.Sprintf("%s/%s/%s/custom_code", s.ApiBaseURL, "beta/sites", siteId)

	var scripts []WebflowAddScript

	for _, rscript := range reg_scripts {

		script := WebflowAddScript{
			ID:       rscript.ID,
			Version:  rscript.Version,
			Location: "header",
		}
		scripts = append(scripts, script)
	}

	request := map[string]interface{}{
		"scripts": scripts,
	}

	//logger.Global.Debug(fmt.Sprintf("fido2: %#v", request))
	data, err := json.Marshal(request)
	if err != nil {
		return nil, &services.ServiceError{Message: "authentication request error"}
	}

	response, err := s.send("PUT", path, data, token)

	if err != nil {
		return nil, &services.ServiceError{Message: "authorization failed"}
	}

	// handle response
	defer response.Body.Close()
	respBody, err := ioutil.ReadAll(response.Body)
	if err != nil {
		return nil, &services.ServiceError{Message: "authorization failed"}
	}

	logger.Global.Info(string(respBody))
	if response.StatusCode != http.StatusOK {
		msg := decodeApiError(respBody)
		return nil, &services.ServiceError{Message: msg.Message}
	}
	var result WebflowAddScriptsResult
	err = json.Unmarshal(respBody, &result)
	if err != nil {
		return nil, &services.ServiceError{Message: "invalid site"}
	}
	return &result, nil
}

// post http util function
func (s *WebflowService) post(path string, body []byte, token string) (*http.Response, error) {

	request, err := http.NewRequest("POST", path, bytes.NewBuffer(body))
	if err != nil {
		return nil, err
	}
	request.Header.Set("Content-type", "application/json")
	if token != "" {
		request.Header.Set("Authorization", fmt.Sprintf("bearer %s", token))
	}
	resp, err := s.client.Do(request)

	if err != nil {
		return nil, err
	}
	return resp, nil
}

func (s *WebflowService) send(method string, path string, body []byte, token string) (*http.Response, error) {

	request, err := http.NewRequest(method, path, bytes.NewBuffer(body))
	if err != nil {
		return nil, err
	}
	request.Header.Set("Content-type", "application/json")
	if token != "" {
		request.Header.Set("Authorization", fmt.Sprintf("bearer %s", token))
	}
	resp, err := s.client.Do(request)

	if err != nil {
		return nil, err
	}
	return resp, nil
}

// post http util function
func (s *WebflowService) get(path string, token string) (*http.Response, error) {

	request, err := http.NewRequest("GET", path, nil)
	if err != nil {
		return nil, err
	}
	request.Header.Set("Content-type", "application/json")
	if token != "" {
		request.Header.Set("Authorization", fmt.Sprintf("bearer %s", token))
	}
	resp, err := s.client.Do(request)

	if err != nil {
		return nil, err
	}
	return resp, nil
}

// post http util function
func (s *WebflowService) postForm(path string, values url.Values, token string) (*http.Response, error) {

	request, err := http.NewRequest("POST", path, strings.NewReader(values.Encode()))
	if err != nil {
		return nil, err
	}
	request.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	if token != "" {
		request.Header.Set("Authorization", fmt.Sprintf("bearer %s", token))
	}
	resp, err := s.client.Do(request)

	if err != nil {
		return nil, err
	}
	return resp, nil
}

type ErrorMessage struct {
	Error            string `json:"error"`
	ErrorDescription string `json:"error_description"`
}

func decodeError(body []byte) ErrorMessage {
	var eMesg ErrorMessage
	json.Unmarshal(body, &eMesg)
	return eMesg
}

type ApiErrorMessage struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}

func decodeApiError(body []byte) ApiErrorMessage {
	var eMesg ApiErrorMessage
	json.Unmarshal(body, &eMesg)
	return eMesg
}

func searchScriptVersion(scripts []WebflowRegisteredScript, id string, version string) *WebflowRegisteredScript {
	for _, script := range scripts {
		if script.ID == id && script.Version == version {
			return &script
		}
	}
	return nil
}

func searchScript(scripts []WebflowRegisteredScript, id string) *WebflowRegisteredScript {
	for _, script := range scripts {
		if script.ID == id {
			return &script
		}
	}
	return nil
}

func increaseVersion(version string) string {
	version_array := strings.Split(version, ".")
	if len(version_array) == 3 {
		build, err := strconv.ParseInt(version_array[0], 10, 32)
		if err != nil {
			return INLINE_DEFAULT_VERSION
		}
		major, err := strconv.ParseInt(version_array[1], 10, 32)
		if err != nil {
			return INLINE_DEFAULT_VERSION
		}
		minor, err := strconv.ParseInt(version_array[2], 10, 32)
		if err != nil {
			return INLINE_DEFAULT_VERSION
		}

		if minor < 100 {
			minor = minor + 1
		} else if major < 100 {
			major = major + 1
			minor = 0
		} else {
			build = build + 1
			major = 0
			minor = 0
		}

		return fmt.Sprintf("%d.%d.%d", build, major, minor)

	}
	return INLINE_DEFAULT_VERSION
}
