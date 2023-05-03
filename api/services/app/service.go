package app

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
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

func (s *AppService) checkUserConsent(appid string, userid string) bool {
	consent, err := s.repo.GetConsent(appid, userid)
	if err != nil {
		logger.Global.Error(err.Error())
		return false
	}
	app, serr := s.GetAppById(appid)
	if serr != nil {
		return false
	}
	if app.Attributes != consent.Attributes {
		return false
	}
	return true
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

func (s *AppService) SetupSession(appid string, origin string, ip string) (string, *services.ServiceError) {

	id := uuid.New().String()

	var app *DevApp
	var serr *services.ServiceError
	if appid != "" {
		app, serr = s.GetAppById(appid)
		if serr != nil {
			return "", services.CreateError("invalid app id")
		}
		if app.Origins != origin {
			return "", services.CreateError("invalid origin")
		}
	} else {

		app, serr = s.GetAppByOrigin(origin)
		if serr != nil {
			return "", services.CreateError("invalid origin")
		}

	}
	// store session with appID
	session := AppSession{
		AppID:  app.ID,
		ID:     id,
		Origin: origin,
		IP:     ip,
	}

	err := s.storeSession(session)
	if err != nil {
		return "", services.CreateError("session error")
	}
	return id, nil
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

func (s *AppService) CheckSessionConsent(id string) (bool, string, *services.ServiceError) {
	session, err := s.getSession(id)
	if err != nil {
		logger.Global.Error(err.Error())
		return false, "", services.CreateError("session error")
	}
	result := s.checkUserConsent(session.AppID, session.UserID)

	return result, session.Token, nil
}

func (s *AppService) SaveSessionConsent(id string) (bool, string, *services.ServiceError) {

	session, err := s.getSession(id)
	if err != nil {
		logger.Global.Error(err.Error())
		return false, "", services.CreateError("session error")
	}
	result := s.createConsent(session.AppID, session.UserID)
	return result, session.Token, nil
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
