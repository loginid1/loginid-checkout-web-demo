package middlewares

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"strings"

	"gitlab.com/loginid/software/libraries/goutil.git/logger"
	http_common "gitlab.com/loginid/software/services/loginid-vault/http/common"
	"gitlab.com/loginid/software/services/loginid-vault/services"
	"gitlab.com/loginid/software/services/loginid-vault/services/keystore"
)

type AuthService struct {
	/*
		keyCache  *bigcache.BigCache
		jwtUrl    string
		clientID  string
		jwtClient *http.Client
	*/

	Keystore *keystore.KeystoreService
}

/*
func NewAuthService(clientID string, jwtUrl string) (*AuthService, error) {
	keyCache, err := bigcache.NewBigCache(bigcache.DefaultConfig(10 * time.Minute))
	if err != nil {
		return nil, errors.New("fail to initialize big cache")
	}
	var netTransport = &http.Transport{
		Dial: (&net.Dialer{
			Timeout: 10 * time.Second,
		}).Dial,
		TLSHandshakeTimeout: 10 * time.Second,
	}
	var jwtClient = &http.Client{
		Timeout:   time.Second * 30,
		Transport: netTransport,
	}
	return &AuthService{keyCache: keyCache, clientID: clientID, jwtUrl: jwtUrl, jwtClient: jwtClient}, nil
}
*/

//TokenAuthenticationMiddleware - handle jwt validation
func (auth *AuthService) Middleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("x-session-token")
		//logger.ForRequest(r).Info("MIDDLE")
		// get authorization header if present
		if authHeader != "" {
			authToken := strings.TrimSpace(authHeader)
			// need to validate authToken and inject username to context
			session, err := auth.validateToken(authToken)
			if err != nil {
				logger.ForRequest(r).Error(err.Error())
				http_common.SendErrorResponse(w, services.NewError("Not authorized"))
				return
			}
			ctx := context.WithValue(r.Context(), "session", *session)
			next.ServeHTTP(w, r.WithContext(ctx))
			return
		}
		// fail not authorize here

		http_common.SendErrorResponse(w, services.NewError("Not authorized"))

	})
}

func (auth *AuthService) MiddlewareWithRedirect(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("x-session-token")
		// get authorization header if present
		if authHeader != "" {
			authToken := strings.TrimSpace(authHeader)
			// need to validate authToken and inject username to context
			session, err := auth.validateToken(authToken)
			if err != nil {
				logger.ForRequest(r).Error(err.Error())
				http_common.SendErrorResponse(w, services.NewError("Not authorized"))
				return
			}
			ctx := context.WithValue(r.Context(), "session", *session)
			next.ServeHTTP(w, r.WithContext(ctx))
			return
		}
		// fail not authorize here

		redirectURL := fmt.Sprintf("%s?redirect_url=%s", "/fe/login", r.RequestURI)
		http.Redirect(w, r, redirectURL, http.StatusMovedPermanently)

	})
}
func (auth *AuthService) ValidateSessionToken(r *http.Request) (*services.UserSession, error) {
	authHeader := r.Header.Get("x-session-token")
	// get authorization header if present
	if authHeader != "" {
		authToken := strings.TrimSpace(authHeader)
		// need to validate authToken and inject username to context
		session, err := auth.validateToken(authToken)
		if err != nil {
			return nil, err
		}
		return session, nil
	}
	return nil, errors.New("No session token found")
}

func (auth *AuthService) validateToken(token string) (*services.UserSession, error) {
	myClaims, serr := auth.Keystore.VerifyDashboardJWT(token)
	if serr != nil {

		return nil, errors.New("invalid token")
	}
	return &services.UserSession{Username: myClaims.Sub, UserID: myClaims.UID, FidoID: myClaims.FID}, nil
}

/*

type LoginIDClaims struct {
	Issuer   string `json:"iss,omitempty"`
	Subject  string `json:"sub,omitempty"`
	Audience string `json:"aud,omitempty"`
	Username string `json:"udata,omitempty"`
	IssuedAt int64  `json:"iat,omitempty"`
	ID       string `json:"jti,omitempty"`
}
func (auth *AuthService) validateToken(token string) (*services.UserSession, error) {

	keyID, err := utils.GetKIDFromToken(token)
	if err != nil {
		return nil, err
	}
	key, err := auth.retrievePublicKey(keyID)
	if err != nil {
		return nil, err
	}

	var myClaims LoginIDClaims
	err = utils.VerifyClaims(token, key, &myClaims)
	if err != nil {
		return nil, err
	}
	//logger.Global.Info(fmt.Sprintf("Claims: %s %#v ", token, myClaims))
	// validate audience here
	if myClaims.Audience != auth.clientID {
		return nil, errors.New("invalid JWT aud")
	}
	// validate expiration

	return &services.UserSession{Username: myClaims.Username, UserID: myClaims.Subject}, nil
}

func (auth *AuthService) retrievePublicKey(kid string) (*ecdsa.PublicKey, error) {

	keyByte, err := auth.keyCache.Get(kid)
	var keyPem string

	if err != nil {
		// try to download from url
		keyPem, err = auth.getKeyFromURL(kid)
		if err != nil {
			return nil, err
		}

		// save keyPem to cache
		err = auth.keyCache.Set(kid, []byte(keyPem))
		if err != nil {
			// just log but dont throw error
			logger.Global.Error(fmt.Sprintf("Failed to cache key: %s", err.Error()))
		}
	} else {
		keyPem = string(keyByte)
	}

	key, err := utils.LoadPublicKeyFromPEM(keyPem)
	if err != nil {
		return nil, err
	}
	return key, nil
}

// post http util function
func (auth *AuthService) getKeyFromURL(kid string) (string, error) {

	request, err := http.NewRequest("GET", fmt.Sprintf("%s/certs", auth.jwtUrl), nil)
	//request.Header.Set("Content-type", "application/json")
	if err != nil {
		return "", err
	}
	q := url.Values{}
	q.Add("kid", kid)
	request.URL.RawQuery = q.Encode()

	resp, err := auth.jwtClient.Do(request)

	if err != nil {
		return "", err
	}
	defer resp.Body.Close()
	resp_body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}
	return string(resp_body), nil
}
*/
