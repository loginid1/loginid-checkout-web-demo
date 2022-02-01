package middlewares

import (
	"context"
	"crypto/ecdsa"
	"errors"
	"fmt"
	"io/ioutil"
	"net"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/allegro/bigcache"
	"gitlab.com/loginid/software/libraries/goutil.git/logger"
	"gitlab.com/loginid/software/services/loginid-vault/handlers"
	"gitlab.com/loginid/software/services/loginid-vault/services"
	"gitlab.com/loginid/software/services/loginid-vault/utils"
)

type AuthService struct {
	keyCache  *bigcache.BigCache
	jwtUrl    string
	clientID  string
	jwtClient *http.Client
}

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

//TokenAuthenticationMiddleware - handle jwt validation
func (auth *AuthService) Middleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("x-session-token")
		// get authorization header if present
		if authHeader != "" {
			authToken := strings.TrimSpace(authHeader)
			// need to validate authToken and inject username to context
			username, err := auth.validateToken(authToken)
			if err != nil {
				logger.ForRequest(r).Error(err.Error())
				handlers.SendErrorResponse(w, services.NewError("Not authorized"))
				return
			}
			ctx := context.WithValue(r.Context(), "username", username)
			next.ServeHTTP(w, r.WithContext(ctx))
			return
		}
		// fail not authorize here

		handlers.SendErrorResponse(w, services.NewError("Not authorized"))

	})
}

type LoginIDClaims struct {
	Issuer   string `json:"iss,omitempty"`
	Subject  string `json:"sub,omitempty"`
	Audience string `json:"aud,omitempty"`
	Username string `json:"udata,omitempty"`
	IssuedAt int64  `json:"iat,omitempty"`
	ID       string `json:"jti,omitempty"`
}

func (auth *AuthService) validateToken(token string) (string, error) {

	keyID, err := utils.GetKIDFromToken(token)
	if err != nil {
		return "", err
	}
	key, err := auth.retrievePublicKey(keyID)
	if err != nil {
		return "", err
	}

	var myClaims LoginIDClaims
	err = utils.VerifyClaims(token, key, &myClaims)
	if err != nil {
		return "", err
	}
	//logger.Global.Info(fmt.Sprintf("Claims: %s %#v ", token, myClaims))
	// validate audience here
	if myClaims.Audience != auth.clientID {
		return "", errors.New("invalid JWT aud")
	}
	// validate expiration

	return myClaims.Username, nil
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
