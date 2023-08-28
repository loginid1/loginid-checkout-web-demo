package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"

	"gitlab.com/loginid/software/libraries/goutil.git/logger"
	http_common "gitlab.com/loginid/software/services/loginid-vault/http/common"
	"gitlab.com/loginid/software/services/loginid-vault/services"
	"gitlab.com/loginid/software/services/loginid-vault/services/webflow"
)

type WebflowHandler struct {
	Service *webflow.WebflowService
}

type WebflowAuthResponse struct {
	Url string `json:"url"`
}

func (h *WebflowHandler) Authorization(w http.ResponseWriter, r *http.Request) {
	/*
		clientID := r.URL.Query().Get("client_id")
		if clientID == "" {
			http_common.SendErrorResponse(w, services.NewError("missing client_id"))
			return
		}

		redirectUri := r.URL.Query().Get("redirect_uri")
		codeChallengeMethod := r.URL.Query().Get("code_challenge_method")
		if strings.ToLower(codeChallengeMethod) != "s256" {
			http_common.SendErrorResponse(w, services.NewError("invalid code challenge method"))
			return
		}
		codeChallenge := r.URL.Query().Get("code_challenge")
		if codeChallenge == "" {
			http_common.SendErrorResponse(w, services.NewError("missing code_challenge"))
			return
		}

		state := r.URL.Query().Get("state")

		//logger.ForRequest(r).Info(fmt.Sprintf("challenge: %s", codeChallenge))

		sesResp, serr := h.AppService.SetupOidcSession(clientID, redirectUri, codeChallenge, state, r.RemoteAddr)

		if serr != nil {

			http_common.SendErrorResponse(w, *serr)
			return
		}
	*/
	scope := "scope=authorized_user:read custom_code:read custom_code:write pages:read sites:read"
	redirectUrl := fmt.Sprintf("%s/oauth/authorize?client_id=%s&response_type=code&%s", h.Service.BaseURL, h.Service.ClientID, scope)
	// redirect
	//http.Redirect(w, r, redirectUrl, http.StatusSeeOther)
	http_common.SendSuccessResponse(w, WebflowAuthResponse{Url: redirectUrl})
}

type WebflowTokenRequest struct {
	Code string `json:"code"`
}

type WebflowTokenResponse struct {
	Token string                `json:"token"`
	Sites []webflow.WebflowSite `json:"sites"`
}

func (h *WebflowHandler) GetToken(w http.ResponseWriter, r *http.Request) {

	var request WebflowTokenRequest
	defer r.Body.Close()
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		logger.ForRequest(r).Error(err.Error())
		http_common.SendErrorResponse(w, services.NewError("failed to parse request"))
		return
	}

	token, serr := h.Service.GetToken(request.Code)
	if serr != nil {
		logger.ForRequest(r).Error(serr.Message)
		http_common.SendErrorResponse(w, *serr)
		return
	}

	// get site ID

	sites_result, serr := h.Service.GetSites(token)
	if serr != nil {
		logger.ForRequest(r).Error(serr.Message)
		http_common.SendErrorResponse(w, *serr)
		return
	}

	//http_common.SendSuccessResponseRaw(w, []byte(result))
	http_common.SendSuccessResponse(w, WebflowTokenResponse{Token: token, Sites: sites_result.Sites})

}

type WebflowSitesRequest struct {
	Token string `json:"token"`
}
type WebflowSitesResponse struct {
	Sites []webflow.WebflowSite `json:"sites"`
}

func (h *WebflowHandler) GetSites(w http.ResponseWriter, r *http.Request) {

	var request WebflowSitesRequest
	defer r.Body.Close()
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		logger.ForRequest(r).Error(err.Error())
		http_common.SendErrorResponse(w, services.NewError("failed to parse request"))
		return
	}

	// get site ID

	sites_result, serr := h.Service.GetSites(request.Token)
	if serr != nil {
		logger.ForRequest(r).Error(serr.Message)
		http_common.SendErrorResponse(w, *serr)
		return
	}

	//http_common.SendSuccessResponseRaw(w, []byte(result))
	http_common.SendSuccessResponse(w, WebflowSitesResponse{Sites: sites_result.Sites})
}

type WebflowPagesRequest struct {
	Token  string `json:"token"`
	SiteID string `json:"site_id"`
}
type WebflowPagesResponse struct {
	Pages []webflow.WebflowPage `json:"pages"`
}

func (h *WebflowHandler) GetPages(w http.ResponseWriter, r *http.Request) {

	var request WebflowPagesRequest
	defer r.Body.Close()
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		logger.ForRequest(r).Error(err.Error())
		http_common.SendErrorResponse(w, services.NewError("failed to parse request"))
		return
	}

	pages_result, serr := h.Service.GetPages(request.Token, request.SiteID)
	if serr != nil {
		logger.ForRequest(r).Error(serr.Message)
		http_common.SendErrorResponse(w, *serr)
		return
	}

	//http_common.SendSuccessResponseRaw(w, []byte(result))
	http_common.SendSuccessResponse(w, WebflowPagesResponse{Pages: pages_result.Pages})
}

type WebflowUploadScriptRequest struct {
	Token  string `json:"token"`
	SiteId string `json:"site_id"`
	AppId  string `json:"app_id"`
}

type WebflowUploadScriptResponse struct {
}

func (h *WebflowHandler) UploadScript(w http.ResponseWriter, r *http.Request) {

	var request WebflowUploadScriptRequest
	defer r.Body.Close()
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		logger.ForRequest(r).Error(err.Error())
		http_common.SendErrorResponse(w, services.NewError("failed to parse request"))
		return
	}

	_, serr := h.Service.UploadScript(request.Token, request.SiteId, request.AppId)
	if serr != nil {
		logger.ForRequest(r).Error(serr.Message)
		http_common.SendErrorResponse(w, *serr)
		return
	}

	http_common.SendSuccessResponse(w, WebflowUploadScriptResponse{})

}
