/*
 *   Copyright (c) 2024 LoginID Inc
 *   All rights reserved.

 *   Licensed under the Apache License, Version 2.0 (the "License");
 *   you may not use this file except in compliance with the License.
 *   You may obtain a copy of the License at

 *   http://www.apache.org/licenses/LICENSE-2.0

 *   Unless required by applicable law or agreed to in writing, software
 *   distributed under the License is distributed on an "AS IS" BASIS,
 *   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *   See the License for the specific language governing permissions and
 *   limitations under the License.
 */

package handlers

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/gorilla/mux"
	"gitlab.com/loginid/software/libraries/goutil.git/logger"
	http_common "gitlab.com/loginid/software/services/loginid-vault/http/common"
	"gitlab.com/loginid/software/services/loginid-vault/services"
	"gitlab.com/loginid/software/services/loginid-vault/services/app"
	"gitlab.com/loginid/software/services/loginid-vault/services/keystore"
	"gitlab.com/loginid/software/services/loginid-vault/services/webflow"
)

type DeveloperHandler struct {
	AppService      *app.AppService
	KeystoreService *keystore.KeystoreService
}

type CreateAppRequest struct {
	Name       string `json:"name"`
	Origins    string `json:"origins"`
	Attributes string `json:"attributes"`
}

type UpdateAppRequest struct {
	ID         string `json:"id"`
	Name       string `json:"name"`
	Origins    string `json:"origins"`
	Attributes string `json:"attributes"`
}

type AppListResponse struct {
	Apps []app.CustomAppInfo `json:"apps"`
}

func (h *DeveloperHandler) CreateApp(w http.ResponseWriter, r *http.Request) {

	session := r.Context().Value("session").(services.UserSession)
	var request CreateAppRequest
	defer r.Body.Close()
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		http_common.SendErrorResponse(w, services.NewError("failed to parse request"))
		return
	}

	app, serr := h.AppService.CreateApp(session.UserID, request.Name, request.Origins, request.Attributes)
	if serr != nil {
		http_common.SendErrorResponse(w, *serr)
		return
	}
	http_common.SendSuccessResponse(w, app)
}

func (h *DeveloperHandler) UpdateApp(w http.ResponseWriter, r *http.Request) {

	session := r.Context().Value("session").(services.UserSession)
	var request UpdateAppRequest
	defer r.Body.Close()
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		http_common.SendErrorResponse(w, services.NewError("failed to parse request"))
		return
	}

	serr := h.AppService.UpdateApp(request.ID, session.UserID, request.Name, request.Origins, request.Attributes)
	if serr != nil {
		http_common.SendErrorResponse(w, *serr)
		return
	}
	http_common.SendSuccess(w)
}

func (h *DeveloperHandler) GetApp(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	appId := vars["id"]

	if appId == "" {
		http_common.SendErrorResponse(w, services.NewError("missing app id parameter"))
		return
	}

	app, serr := h.AppService.GetAppById(appId)
	if serr != nil {
		http_common.SendErrorResponse(w, *serr)
		return
	}

	session := r.Context().Value("session").(services.UserSession)
	if app.OwnerID != session.UserID {
		http_common.SendErrorResponse(w, services.NewError("app not found"))
		return
	}

	http_common.SendSuccessResponse(w, app)
}

func (h *DeveloperHandler) GetAppList(w http.ResponseWriter, r *http.Request) {

	session := r.Context().Value("session").(services.UserSession)

	apps, serr := h.AppService.GetAppsByOwner(session.UserID)
	if serr != nil {
		http_common.SendErrorResponse(w, *serr)
		return
	}
	appList := AppListResponse{
		Apps: apps,
	}
	http_common.SendSuccessResponse(w, appList)
}

type AppUserListRequest struct {
	AppID  string `json:"app_id"`
	Offset int    `json:"offset"`
}

type AppUserListResponse struct {
	Users  []app.CustomAppUser `json:"users"`
	Count  int64               `json:"count"`
	Offset int                 `json:"offset"`
	Limit  int                 `json:"limit"`
}

func (h *DeveloperHandler) GetAppUserList(w http.ResponseWriter, r *http.Request) {

	session := r.Context().Value("session").(services.UserSession)
	var request AppUserListRequest
	defer r.Body.Close()
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		http_common.SendErrorResponse(w, services.NewError("failed to parse request"))
		return
	}

	m_app, serr := h.AppService.GetAppById(request.AppID)
	if serr != nil {
		http_common.SendErrorResponse(w, *serr)
		return
	}

	if m_app.OwnerID != session.UserID {
		http_common.SendErrorResponse(w, services.NewError("data not authorized"))
		return
	}

	users, count, serr := h.AppService.ListConsentsByApp(r.Context(), m_app.ID, request.Offset)

	if serr != nil {
		http_common.SendErrorResponse(w, *serr)
		return
	}

	userList := AppUserListResponse{
		Users:  users,
		Count:  count,
		Offset: request.Offset,
		Limit:  app.KAppUserConsentLimit,
	}
	http_common.SendSuccessResponse(w, userList)
}

type SetupIntegrationRequest struct {
	AppID        string                  `json:"app_id"`
	Vendor       string                  `json:"vendor"`
	Settings     webflow.WebflowSettings `json:"settings"`
	WebflowToken string                  `json:"webflow_token"`
}

type SetupIntegrationResponse struct {
	ID    string `json:"id"`
	AppID string `json:"app_id"`
}

func (h *DeveloperHandler) SetupIntegration(w http.ResponseWriter, r *http.Request) {

	session := r.Context().Value("session").(services.UserSession)
	var request SetupIntegrationRequest
	defer r.Body.Close()
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		http_common.SendErrorResponse(w, services.NewError("failed to parse request"))
		return
	}

	schema := "webflow_v1"
	integration, serr := h.AppService.SetupIntegration(request.AppID, session.UserID, request.Vendor, schema, request.Settings, request.WebflowToken)
	if serr != nil {
		http_common.SendErrorResponse(w, *serr)
		return
	}

	http_common.SendSuccessResponse(w, integration)
}

type UpdateIntegrationRequest struct {
	AppID        string                  `json:"app_id"`
	ID           string                  `json:"id"`
	Vendor       string                  `json:"vendor"`
	Settings     webflow.WebflowSettings `json:"settings"`
	WebflowToken string                  `json:"webflow_token"`
}

type UpdateIntegrationResponse struct {
	ID    string `json:"id"`
	AppID string `json:"app_id"`
}

func (h *DeveloperHandler) UpdateIntegration(w http.ResponseWriter, r *http.Request) {

	session := r.Context().Value("session").(services.UserSession)
	var request UpdateIntegrationRequest
	defer r.Body.Close()
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		http_common.SendErrorResponse(w, services.NewError("failed to parse request"))
		return
	}

	integration, serr := h.AppService.UpdateIntegration(request.AppID, session.UserID, request.Vendor, request.Settings, request.WebflowToken)
	if serr != nil {
		http_common.SendErrorResponse(w, *serr)
		return
	}

	http_common.SendSuccessResponse(w, integration)
}

type GetIntegrationRequest struct {
	AppID  string `json:"app_id"`
	Vendor string `json:"vendor"`
}

type GetIntegrationResponse struct {
	ID       string      `json:"id"`
	AppID    string      `json:"app_id"`
	Settings interface{} `json:"settings"`
	Iat      time.Time   `json:"iat"`
	Uat      time.Time   `json:"uat"`
}

func (h *DeveloperHandler) GetIntegration(w http.ResponseWriter, r *http.Request) {

	session := r.Context().Value("session").(services.UserSession)
	var request UpdateIntegrationRequest
	defer r.Body.Close()
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		http_common.SendErrorResponse(w, services.NewError("failed to parse request"))
		return
	}

	integration, serr := h.AppService.GetIntegrationAppId(request.AppID, session.UserID, request.Vendor)
	if serr != nil {
		http_common.SendErrorResponse(w, *serr)
		return
	}
	response := GetIntegrationResponse{
		ID:       integration.ID,
		AppID:    integration.AppID,
		Settings: integration.Settings,
		Iat:      integration.Iat,
		Uat:      integration.Uat,
	}

	http_common.SendSuccessResponse(w, response)
}

type ValidateTokenRequest struct {
	Token  string `json:"token"`
	Vendor string `json:"vendor"`
}

type ValidateTokenResponse struct {
	Signature string `json:"signature"`
}

func (h *DeveloperHandler) ValidateToken(w http.ResponseWriter, r *http.Request) {

	var request ValidateTokenRequest
	defer r.Body.Close()
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		logger.ForRequest(r).Error(err.Error())
		http_common.SendErrorResponse(w, services.NewError("failed to parse request"))
		return
	}

	claims, serr := h.KeystoreService.VerifyIDJWT(request.Token)

	if serr != nil {
		http_common.SendErrorResponse(w, *serr)
		return
	}
	signature, serr := h.AppService.SignIntegrationToken(claims.Client, request.Vendor, request.Token)
	if serr != nil {
		http_common.SendErrorResponse(w, *serr)
		return
	}
	http_common.SendSuccessResponse(w, ValidateTokenResponse{Signature: signature})

}
