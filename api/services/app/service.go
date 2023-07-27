package app

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
	"gitlab.com/loginid/software/libraries/goutil.git"
	"gitlab.com/loginid/software/libraries/goutil.git/logger"
	"gitlab.com/loginid/software/services/loginid-vault/services"
	"gitlab.com/loginid/software/services/loginid-vault/utils"
	"gorm.io/gorm"
)

type AppService struct {
	repo  *AppRepository
	redis *redis.Client
}

func NewAppService(db *gorm.DB, redis *redis.Client) *AppService {
	return &AppService{repo: &AppRepository{DB: db}, redis: redis}
}

// CreateApp
func (s *AppService) CreateApp(userid string, name string, origin string, attributes string) (*DevApp, *services.ServiceError) {

	app := &DevApp{
		AppName:    name,
		Attributes: attributes,
		Status:     kStatusActive,
		OwnerID:    userid,
		Origins:    origin,
	}
	err := s.repo.CreateApp(app)
	if err != nil {

		return nil, services.CreateError("fail to create app")
	}
	return app, nil
}

// GetAppByIdWithOwner
func (s *AppService) GetAppByIdWithOwner(ownerid string, appid string) (*DevApp, *services.ServiceError) {
	app, err := s.repo.GetAppById(appid)
	if err != nil {
		return nil, services.CreateError("app not found")
	}
	if ownerid != app.OwnerID {
		return nil, services.CreateError("permission denied")
	}
	return app, nil
}

// GetAppsByOwner
func (s *AppService) GetAppsByOwner(ownerid string) ([]DevApp, *services.ServiceError) {
	var apps []DevApp
	apps, err := s.repo.GetAppsByOwner(ownerid)
	if err != nil {
		logger.Global.Error(err.Error())
		return apps, services.CreateError("app not found")
	}
	return apps, nil
}

// Update app
// TODO clear app cache
func (s *AppService) UpdateApp(appid string, ownerid string, name string, origins string, attributes string) *services.ServiceError {

	app, err := s.repo.GetAppById(appid)
	if err != nil {
		return services.CreateError("app not found")
	}
	if ownerid != app.OwnerID {
		return services.CreateError("permission denied")
	}

	app.AppName = name
	app.Attributes = attributes
	app.Origins = origins
	err = s.repo.UpdateApp(app)
	if err != nil {
		return services.CreateError("update failed")
	}
	return nil
}

//TODO cache app to redis
func (s *AppService) GetAppByOrigin(origin string) (*DevApp, *services.ServiceError) {
	app, err := s.repo.GetAppByOwnerOrigin(origin, "system")
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			// create new record
			app := &DevApp{
				AppName:    origin,
				Attributes: fmt.Sprintf("%s", KEmailAttribute),
				Status:     kStatusActive,
				OwnerID:    "system",
				Origins:    origin,
			}
			err = s.repo.CreateApp(app)
			if err != nil {

				return nil, services.CreateError("fail to create app")
			}
			return app, nil
		}
		return nil, services.CreateError("fail to retrieve app")
	}
	return app, nil

}

//TODO cache app to redis
func (s *AppService) GetAppById(id string) (*DevApp, *services.ServiceError) {

	app, err := s.repo.GetAppById(id)
	if err != nil {
		return nil, services.CreateError("fail to retrieve app")
	}
	return app, nil
}

func (s *AppService) createConsent(appid string, userid string) bool {
	app, serr := s.GetAppById(appid)
	if serr != nil {
		return false
	}

	const RETRIES = 3
	for i := 0; i < RETRIES; i++ {

		alias, err := utils.GenerateRandomString(16)
		if err != nil {
			return false
		}
		consent := &AppConsent{
			AppID:      appid,
			UserID:     userid,
			Attributes: app.Attributes,
			Status:     kStatusActive,
			Alias:      alias,
		}

		err = s.repo.CreateConsent(consent)
		if err != nil {
			logger.Global.Error(err.Error())
		} else {
			// break out of retries
			return true
		}
	}
	return false
}

func (s *AppService) SetupSession(appid string, origin string, ip string) (*AppSession, *services.ServiceError) {

	id := uuid.New().String()

	var app *DevApp
	var serr *services.ServiceError

	if appid == goutil.GetEnv("CONSOLE_APP_ID", "") && origin == goutil.GetEnv("WALLET_BASEURL", "") {

		// check session for LoginID Wallet dashboard
		app = &DevApp{
			ID:         appid,
			Origins:    origin,
			AppName:    "LoginID Wallet",
			Attributes: KEmailAttribute,
			Status:     kStatusActive,
			Iat:        time.Now(),
			Uat:        time.Now(),
		}
	} else if appid != "" {
		app, serr = s.GetAppById(appid)
		if serr != nil {
			return nil, services.CreateError("invalid app id")
		}
		if app.Origins != origin {
			return nil, services.CreateError("invalid origin")
		}
	} else {

		app, serr = s.GetAppByOrigin(origin)
		if serr != nil {
			return nil, services.CreateError("invalid origin")
		}

	}
	// store session with appID
	session := AppSession{
		AppID:      app.ID,
		AppName:    app.AppName,
		Attributes: app.Attributes,
		ID:         id,
		Origin:     origin,
		IP:         ip,
	}

	err := s.storeSession(session)
	if err != nil {
		return nil, services.CreateError("session error")
	}
	return &session, nil
}

func (s *AppService) GetSession(id string) (*AppSession, *services.ServiceError) {
	session, err := s.getSession(id)
	if err != nil {
		return nil, services.CreateError("failed to retrieve session")
	}
	return session, nil
}

func (s *AppService) SetupOidcSession(appid string, redirect_uri string, code_challenge string, state string, ip string) (*AppSession, *services.ServiceError) {

	app, serr := s.GetAppById(appid)
	if serr != nil {
		return nil, services.CreateError("invalid app id")
	}

	challenge := fmt.Sprintf("%s/%s", appid, code_challenge)
	// lookup code challenge
	_, err := s.getChallenge(challenge)
	if err == nil {
		return nil, services.CreateError("challenge is already existed")
	}

	// make sure redirect_uri within origin
	if len(redirect_uri) > 0 && !strings.HasPrefix(redirect_uri, app.Origins) {
		return nil, services.CreateError("invalid callback url")
	}

	// generate random code
	code, err := utils.GenerateRandomBytes(32)
	if err != nil {
		return nil, services.CreateError("fail to generate session")
	}

	// store session with appID
	session := AppSession{
		AppID:      app.ID,
		AppName:    app.AppName,
		Attributes: app.Attributes,
		ID:         appid,
		Origin:     app.Origins,
		IP:         ip,
		Oidc:       &OidcExtras{RedirectUri: redirect_uri, Code: base64.RawURLEncoding.EncodeToString(code), State: state},
	}

	err = s.storeSession(session)
	if err != nil {
		return nil, services.CreateError("session error")
	}

	err = s.storeChallenge(challenge, session.ID)
	if err != nil {
		return nil, services.CreateError("session error")
	}

	return &session, nil
}

func (s *AppService) UpdateSession(sessionid string, userid string) (*AppSession, *services.ServiceError) {

	logger.Global.Info(fmt.Sprintf("update session %s", sessionid))
	session, err := s.getSession(sessionid)
	if err != nil {
		logger.Global.Error(err.Error())
		return nil, services.CreateError("session update error")
	}
	session.UserID = userid
	err = s.storeSession(*session)
	if err != nil {
		logger.Global.Error(err.Error())
		return nil, services.CreateError("session update error")
	}
	return session, nil
}

func (s *AppService) UpdateSessionToken(sessionid string, token string) (*AppSession, *services.ServiceError) {

	logger.Global.Info(fmt.Sprintf("update session %s", sessionid))
	session, err := s.getSession(sessionid)
	if err != nil {
		logger.Global.Error(err.Error())
		return nil, services.CreateError("session update error")
	}
	session.Token = token
	err = s.storeSession(*session)
	if err != nil {
		logger.Global.Error(err.Error())
		return nil, services.CreateError("session update error")
	}
	return session, nil
}

func (s *AppService) CheckSessionConsent(id string) (session *AppSession, required []string, serr *services.ServiceError) {
	session, err := s.getSession(id)
	if err != nil {
		logger.Global.Error(err.Error())
		return nil, nil, services.CreateError("session error")
	}
	if session.Token == "" {
		return nil, nil, services.CreateError("session missing token")
	}

	required = strings.Split(session.Attributes, ",")

	consent, err := s.repo.GetConsent(session.AppID, session.UserID)
	if err != nil {
		serr = &services.ServiceError{Error: err, Message: "failed to fetch app consent"}
		logger.Global.Error(err.Error())
		return nil, nil, serr
	}

	attrArr := strings.Split(consent.Attributes, ",")
	required = goutil.SubtractLists(required, attrArr)

	return session, required, nil
}

func (s *AppService) SaveSessionConsent(id string) (bool, *AppSession, *services.ServiceError) {

	session, err := s.getSession(id)
	if err != nil {
		logger.Global.Error(err.Error())
		return false, nil, services.CreateError("session error")
	}
	result := s.createConsent(session.AppID, session.UserID)
	return result, session, nil
}

func (s *AppService) ListConsentsByUsername(ctx context.Context, username string) ([]CustomConsent, *services.ServiceError) {
	consents, err := s.repo.ListConsentsByUsername(username)
	if err != nil {
		logger.ForContext(ctx).Error(err.Error())
		return consents, services.CreateError("data error")
	}
	return consents, nil
}

func (s *AppService) storeSession(session AppSession) error {
	ctx := context.Background()
	sessionbyte, err := json.Marshal(session)
	if err != nil {
		logger.Global.Error(err.Error())
		return err
	}
	err = s.redis.Set(ctx, session.ID, sessionbyte, 30*time.Minute).Err()
	if err != nil {
		return err
	}
	return nil

}

func (s *AppService) getSession(id string) (*AppSession, error) {
	ctx := context.Background()
	value, err := s.redis.Get(ctx, id).Bytes()
	if err != nil {
		return nil, err
	}

	var session AppSession
	err = json.Unmarshal(value, &session)
	if err != nil {
		return nil, err
	}

	return &session, nil

}

func (s *AppService) storeChallenge(key string, value string) error {
	ctx := context.Background()
	err := s.redis.Set(ctx, key, value, 30*time.Minute).Err()
	if err != nil {
		return err
	}
	return nil

}

func (s *AppService) getChallenge(key string) (string, error) {
	ctx := context.Background()
	return s.redis.Get(ctx, key).Result()

}
