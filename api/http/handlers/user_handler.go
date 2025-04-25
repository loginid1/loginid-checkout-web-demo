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

/**
 */

import (
	"encoding/json"
	"fmt"
	"net/http"

	"gitlab.com/loginid/software/libraries/goutil.git"
	http_common "gitlab.com/loginid/software/services/loginid-vault/http/common"
	"gitlab.com/loginid/software/services/loginid-vault/services"
	"gitlab.com/loginid/software/services/loginid-vault/services/app"
	"gitlab.com/loginid/software/services/loginid-vault/services/fido2"
	"gitlab.com/loginid/software/services/loginid-vault/services/user"
	"gitlab.com/loginid/software/services/loginid-vault/utils"
)

type UserHandler struct {
	UserService  *user.UserService
	Fido2Service *fido2.Fido2Service
	AppService   *app.AppService
}

type CredentialListResponse struct {
	Credentials []user.CredentialResponse `json:"credentials"`
}

func (h *UserHandler) GetCredentialListHandler(w http.ResponseWriter, r *http.Request) {

	session := r.Context().Value("session").(services.UserSession)
	credentials, err := h.UserService.GetCredentialList(session.Username)
	if err != nil {
		http_common.SendErrorResponse(w, services.NewError("no credential found"))
		return
	}

	http_common.SendSuccessResponse(w, CredentialListResponse{Credentials: credentials})
}

type RenameCredentialRequest struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

func (h *UserHandler) RenameCredentialHandler(w http.ResponseWriter, r *http.Request) {

	var request RenameCredentialRequest
	defer r.Body.Close()
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		http_common.SendErrorResponse(w, services.NewError("failed to parse request"))
		return
	}

	err := h.UserService.UserRepository.RenameCredential(request.ID, request.Name)
	if err != nil {
		http_common.SendErrorResponse(w, services.NewError("rename credential failed"))
		return
	}

	http_common.SendSuccess(w)
}

func (h *UserHandler) GetUserProfileHandler(w http.ResponseWriter, r *http.Request) {
	session := r.Context().Value("session").(services.UserSession)
	profile, err := h.UserService.GetProfile(session.Username)
	if err != nil {
		http_common.SendErrorResponse(w, services.NewError("no profile found"))
		return
	}

	http_common.SendSuccessResponse(w, profile)
}

type RecoveryPhrase struct {
	ID         string `json:"id"`
	PublicKey  string `json:"public_key"`
	PrivateKey string `json:"private_key"`
}

func (h *UserHandler) CreateRecoveryHandler(w http.ResponseWriter, r *http.Request) {
	session := r.Context().Value("session").(services.UserSession)
	mnemonic, recovery, err := h.UserService.CreateRecovery(session.Username)
	if err != nil {
		http_common.SendErrorResponse(w, services.NewError("fail to create mnemonic recovery code"))
		return
	}

	response := RecoveryPhrase{ID: recovery.ID, PublicKey: recovery.PublicKey, PrivateKey: mnemonic}

	http_common.SendSuccessResponse(w, response)

}

func (h *UserHandler) GenerateRecoveryInitHandler(w http.ResponseWriter, r *http.Request) {
	session := r.Context().Value("session").(services.UserSession)
	mnemonic, recovery, err := h.UserService.GenerateRecoveryInit(session.Username)
	if err != nil {
		http_common.SendErrorResponse(w, services.NewError("fail to create mnemonic recovery code"))
		return
	}

	response := RecoveryPhrase{ID: recovery.ID, PublicKey: recovery.PublicKey, PrivateKey: mnemonic}

	http_common.SendSuccessResponse(w, response)

}

type GenerateRecoveryCompleteRequest struct {
	PublicKey string `json:"public_key"`
}

func (h *UserHandler) GenerateRecoveryCompleteHandler(w http.ResponseWriter, r *http.Request) {
	session := r.Context().Value("session").(services.UserSession)
	var request GenerateRecoveryCompleteRequest
	defer r.Body.Close()
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		http_common.SendErrorResponse(w, services.NewError("failed to parse request"))
		return
	}

	err := h.UserService.GenerateRecoveryComplete(session.Username, request.PublicKey)
	if err != nil {
		http_common.SendErrorResponse(w, services.NewError("fail to create mnemonic recovery code"))
		return
	}

	http_common.SendSuccessResponse(w, map[string]interface{}{"success": true})

}

type RecoveryListResponse struct {
	Recovery []user.UserRecovery `json:"recovery"`
}

func (h *UserHandler) GetRecoveryListHandler(w http.ResponseWriter, r *http.Request) {
	session := r.Context().Value("session").(services.UserSession)
	recovery, err := h.UserService.GetRecoveryList(session.Username)
	if err != nil {
		http_common.SendErrorResponse(w, services.NewError("no recovery found"))
		return
	}

	http_common.SendSuccessResponse(w, RecoveryListResponse{Recovery: recovery})
}

func (h *UserHandler) GenerateCredentialCodeHandler(w http.ResponseWriter, r *http.Request) {
	session := r.Context().Value("session").(services.UserSession)

	response, err := h.Fido2Service.GenerateCode(session.FidoID)
	if err != nil {
		http_common.SendErrorResponse(w, *err)
		return
	}

	http_common.SendSuccessResponseRaw(w, response)
}

type GetCodeLinkResponse struct {
	Link   string `json:"link"`
	QRCode string `json:"qr_code"`
}

func (h *UserHandler) GetCodeLink(w http.ResponseWriter, r *http.Request) {
	session := r.Context().Value("session").(services.UserSession)

	wallet_url := goutil.GetEnv("WALLET_BASEURL", "")
	link := fmt.Sprintf("%s/add?u=%s", wallet_url, session.Username)

	qrcode, err := utils.GenerateQRCode(link)
	if err != nil {
		http_common.SendErrorResponse(w, services.NewError("fail to generate qr code"))
		return
	}
	http_common.SendSuccessResponse(w, GetCodeLinkResponse{Link: link, QRCode: qrcode})
}

// TODO: pagination
type ConsentListResponse struct {
	Consents []app.CustomConsent `json:"consents"`
}

func (h *UserHandler) GetConsentList(w http.ResponseWriter, r *http.Request) {

	session := r.Context().Value("session").(services.UserSession)

	consents, serr := h.AppService.ListConsentsByUsername(r.Context(), session.Username)
	//logger.ForRequest(r).Info(fmt.Sprintf("%#v", consents))
	if serr != nil {
		http_common.SendErrorResponse(w, services.NewError("no results found"))
		return
	}

	http_common.SendSuccessResponse(w, ConsentListResponse{Consents: consents})

}
