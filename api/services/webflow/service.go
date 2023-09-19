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

	"gitlab.com/loginid/software/libraries/goutil.git"
	"gitlab.com/loginid/software/libraries/goutil.git/logger"
	"gitlab.com/loginid/software/services/loginid-vault/services"
	"gitlab.com/loginid/software/services/loginid-vault/utils"
)

type WebflowService struct {
	client       *http.Client
	BaseURL      string
	ApiBaseURL   string
	ClientID     string
	clientSecret string
}

var WALLET_BASEURL = goutil.GetEnv("WALLET_BASEURL", "https://wallet.loginid.io")
var WALLET_API_BASEURL = goutil.GetEnv("WALLET_API_BASEURL", "https://api.wallet.loginid.io")

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

	path := fmt.Sprintf("%s/%s", s.ApiBaseURL, "oauth/access_token")

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

	//logger.Global.Info(string(respBody))
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

	//logger.Global.Info(string(respBody))
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

func (s *WebflowService) GetPages(token string, siteid string) (*WebflowPagesResult, *services.ServiceError) {

	path := fmt.Sprintf("%s/%s/%s/pages", s.ApiBaseURL, "beta/sites", siteid)

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

	if response.StatusCode != http.StatusOK {
		msg := decodeError(respBody)
		return nil, &services.ServiceError{Message: msg.Error}
	}
	var result WebflowPagesResult
	err = json.Unmarshal(respBody, &result)
	if err != nil {
		return nil, &services.ServiceError{Message: "invalid pages"}
	}

	// populate full path
	pages := populatePaths(result.Pages)
	result.Pages = pages
	return &result, nil
}

func (s *WebflowService) UploadScript(token string, siteId string, appId string) (bool, *services.ServiceError) {
	scripts, err := s.RegisterScripts(token, siteId, appId)
	if err != nil {
		return false, err
	}
	_, err = s.addScripts(token, siteId, scripts.RegisteredScripts)
	if err != nil {
		return false, err
	}

	return true, nil

}

func (s *WebflowService) UpdateIntegrationScript(token string, appId string, settings WebflowSettings, publicKey string) *services.ServiceError {

	siteId := settings.SiteID
	// get current registered script
	current_scripts, err := s.getRegisterScripts(token, siteId)
	if err != nil {
		return err
	}
	authorized_script := searchScript(current_scripts.RegisteredScripts, "loginidauthorizedscript")

	// get source from template

	protectedPages, loginPage := getWebflowSettingInfo(settings)

	buttonData := WebflowProtectedPagesTemplate{
		WalletApiURL:   WALLET_API_BASEURL,
		AppID:          appId,
		PublicKey:      publicKey,
		ProtectedPages: protectedPages,
		LoginPage:      loginPage,
	}
	source, e := utils.ParseTemplate("services/webflow/templates", "check_authorized_template.js", buttonData)
	if e != nil {
		logger.Global.Error(e.Error())
		return services.CreateError("failed to update script")
	}

	if authorized_script == nil {

		authorized_script, err = s.registerInline(token, siteId, source, "LoginidAuthorizedScript", CHECK_AUTHORIZED_DEFAULT_VERSION)
		if err != nil {
			return err
		}
	} else {
		// increase version
		version := increaseVersion(authorized_script.Version, CHECK_AUTHORIZED_DEFAULT_VERSION)

		authorized_script, err = s.registerInline(token, siteId, source, "LoginidAuthorizedScript", version)
		if err != nil {
			return err
		}
	}

	// make sure script already

	sdk_script := searchScriptVersion(current_scripts.RegisteredScripts, "loginidwalletsdk", SDK_DEFAULT_VERSION)
	if sdk_script == nil {
		sdk_script, err = s.registerSDKScript(token, siteId)
		if err != nil {
			return err
		}
	}

	inline_script := searchScript(current_scripts.RegisteredScripts, "loginidbuttonscript")

	if inline_script == nil {
		// get source from template

		buttonData := WebflowButtonTemplate{
			WalletURL: WALLET_BASEURL,
			AppID:     appId,
		}
		source, e := utils.ParseTemplate("services/webflow/templates", "loginid_button_template.js", buttonData)
		if e != nil {
			return services.CreateError("failed to create button script")
		}

		inline_script, err = s.registerInline(token, siteId, source, "LoginidButtonScript", BUTTON_DEFAULT_VERSION)
		if err != nil {
			return err
		}
	}
	// add script

	_, err = s.addScripts(token, siteId, []WebflowRegisteredScript{*sdk_script, *inline_script, *authorized_script})
	if err != nil {
		return err
	}
	return nil

}

func getWebflowSettingInfo(settings WebflowSettings) (string, string) {
	var protected_arr []string
	for _, page := range settings.ProjectedPages {
		protected_arr = append(protected_arr, page.Path)
	}

	data, _ := json.Marshal(protected_arr)

	return string(data), settings.LoginPage
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

	//logger.Global.Info(string(respBody))
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

const BUTTON_DEFAULT_VERSION = "1.0.4"
const CHECK_AUTHORIZED_DEFAULT_VERSION = "1.0.4"
const SDK_DEFAULT_VERSION = "1.1.10"

func (s *WebflowService) RegisterScripts(token string, siteId string, appId string) (*WebflowRegisteredScriptsResult, *services.ServiceError) {

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

	/*
		utils_script := searchScriptVersion(current_scripts.RegisteredScripts, "loginidwebflowutil", UTILS_DEFAULT_VERSION)
		utils_source, e := utils.ParseTemplate("services/webflow/templates", "webflow_utils_template.js", nil)
		if e != nil {
			return nil, services.CreateError("failed to create utils script")
		}
		if utils_script == nil {
			utils_script, err = s.registerInline(token, siteId, utils_source, "LoginidUtilsScript", UTILS_DEFAULT_VERSION)
			if err != nil {
				return nil, err
			}
		}
	*/

	inline_script := searchScript(current_scripts.RegisteredScripts, "loginidbuttonscript")

	// get source from template

	buttonData := WebflowButtonTemplate{
		WalletURL: WALLET_BASEURL,
		AppID:     appId,
	}
	source, e := utils.ParseTemplate("services/webflow/templates", "loginid_button_template.js", buttonData)
	if e != nil {
		return nil, services.CreateError("failed to create button script")
	}

	if inline_script == nil {

		inline_script, err = s.registerInline(token, siteId, source, "LoginidButtonScript", BUTTON_DEFAULT_VERSION)
		if err != nil {
			return nil, err
		}
	} else {
		// increase version
		version := increaseVersion(inline_script.Version, BUTTON_DEFAULT_VERSION)

		inline_script, err = s.registerInline(token, siteId, source, "LoginidButtonScript", version)
		if err != nil {
			return nil, err
		}
	}

	return &WebflowRegisteredScriptsResult{RegisteredScripts: []WebflowRegisteredScript{*sdk_script, *inline_script}}, nil
}

func (s *WebflowService) registerInline(token string, siteId string, source string, name string, version string) (*WebflowRegisteredScript, *services.ServiceError) {
	path := fmt.Sprintf("%s/%s/%s/registered_scripts/inline", s.ApiBaseURL, "beta/sites", siteId)

	request := map[string]interface{}{
		"sourceCode":  source,
		"version":     version,
		"displayName": name,
		"canCopy":     false,
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

	//logger.Global.Info(string(respBody))
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
		"canCopy":        false,
		"hostedLocation": "https://sdk-cdn.wallet.loginid.io/loginid-wallet-sdk.0.45.40-beta.min.js",
		"integrityHash":  "sha384-RdEgziOWLvMDtZtgJzkiTKDmDzHH8h2cesd4H1Yib4pWbTjV+PQ9BE3N0FiONZvF",
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

	//logger.Global.Info(string(respBody))
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

	//logger.Global.Info(string(respBody))
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

func increaseVersion(version string, defaultVersion string) string {
	version_array := strings.Split(version, ".")
	if len(version_array) == 3 {
		build, err := strconv.ParseInt(version_array[0], 10, 32)
		if err != nil {
			return defaultVersion
		}
		major, err := strconv.ParseInt(version_array[1], 10, 32)
		if err != nil {
			return defaultVersion
		}
		minor, err := strconv.ParseInt(version_array[2], 10, 32)
		if err != nil {
			return defaultVersion
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
	return defaultVersion
}

func populatePaths(pages []WebflowPage) []WebflowPage {

	parentPathSet := make(map[string]WebflowPage)
	for _, page := range pages {
		parentPathSet[page.ID] = page
	}

	var result []WebflowPage
	for _, page := range pages {
		path := fmt.Sprintf("/%s", page.Slug)
		if page.ParentID != "" {
			path = prependPath(parentPathSet, page.ParentID, path)
			//logger.Global.Info(fmt.Sprintf("parent %s %d", path, len(parentPathSet)))
		}
		page.Path = path
		result = append(result, page)
	}
	return result
}

func prependPath(set map[string]WebflowPage, parentId string, path string) string {
	parent, ok := set[parentId]
	if ok {
		fullPath := fmt.Sprintf("/%s%s", parent.Slug, path)
		if parent.ParentID != "" {
			fullPath = prependPath(set, parent.ParentID, fullPath)
		}

		return fullPath
	}
	return path
}
