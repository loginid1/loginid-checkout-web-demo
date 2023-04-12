package handlers

import (
	"encoding/json"
	"net/http"

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
	Apps []app.DevApp `json:"apps"`
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
