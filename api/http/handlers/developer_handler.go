package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/gorilla/mux"
	http_common "gitlab.com/loginid/software/services/loginid-vault/http/common"
	"gitlab.com/loginid/software/services/loginid-vault/services"
	"gitlab.com/loginid/software/services/loginid-vault/services/app"
)

type DeveloperHandler struct {
	AppService *app.AppService
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
