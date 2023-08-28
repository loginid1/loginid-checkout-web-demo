package app

import (
	"strings"

	"github.com/google/uuid"
	"gitlab.com/loginid/software/services/loginid-vault/services/pass"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type AppRepository struct {
	DB *gorm.DB
}

func (repo *AppRepository) CreateApp(a *DevApp) error {

	tx := repo.DB.Begin()

	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	if err := tx.Error; err != nil {
		return err
	}

	if a.ID == "" {
		a.ID = uuid.New().String()
	}

	if err := tx.Create(&a).Error; err != nil {
		tx.Rollback()
		return err
	}

	return tx.Commit().Error
}

func (repo *AppRepository) UpdateApp(a *DevApp) error {

	tx := repo.DB.Begin()

	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	if err := tx.Error; err != nil {
		return err
	}

	if err := tx.Save(&a).Error; err != nil {
		tx.Rollback()
		return err
	}

	return tx.Commit().Error
}

func (repo *AppRepository) CreateConsent(appConsent *AppConsent, passConsent []pass.PassConsent) error {

	tx := repo.DB.Begin()

	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	if err := tx.Error; err != nil {
		return err
	}

	if err := tx.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "app_id"}, {Name: "user_id"}},    // key colume
		DoUpdates: clause.AssignmentColumns([]string{"attributes", "uat"}), // column needed to be updated
	}).Create(&appConsent).Error; err != nil {
		tx.Rollback()
		return err
	}

	if err := tx.Create(&passConsent).Error; err != nil {
		tx.Rollback()
		return err
	}

	return tx.Commit().Error
}

func (repo *AppRepository) GetAppByOwnerOrigin(origin string, owner string) (*DevApp, error) {
	var app DevApp
	err := repo.DB.Where("origins = ? ", origin).Where("owner_id = ?", owner).Take(&app).Error
	if err != nil {
		return nil, err
	}
	return &app, nil
}

func (repo *AppRepository) GetAppById(id string) (*DevApp, error) {
	var app DevApp
	err := repo.DB.Where("id = ? ", id).Take(&app).Error
	if err != nil {
		return nil, err
	}
	return &app, nil
}

func (repo *AppRepository) GetAppsByOwner(userid string) ([]DevApp, error) {
	var apps []DevApp
	err := repo.DB.Where("owner_id = ?", userid).Find(&apps).Error
	if err != nil {
		return apps, err
	}
	return apps, nil
}

func (repo *AppRepository) GetConsent(appid string, userid string) (*AppConsent, error) {
	var consent AppConsent
	err := repo.DB.Where("app_id = ? ", appid).Where("user_id = ?", userid).Take(&consent).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			// return empty record
			return &consent, nil
		}
		return nil, err
	}
	return &consent, nil
}

func (repo *AppRepository) ListConsentsByUsername(username string) ([]CustomConsent, error) {
	var consents []CustomConsent
	if err := repo.DB.Model(AppConsent{}).Select("app_consents.user_id, app_consents.app_id, app_consents.attributes, app_consents.status, app_consents.uat, dev_apps.origins").Joins("JOIN users ON users.id = app_consents.user_id").Joins("JOIN dev_apps ON dev_apps.id = app_consents.app_id").Where("users.username_lower = ?", strings.ToLower(username)).Scan(&consents).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return consents, nil
		}
		return nil, err
	}
	return consents, nil
}

/** check if the user owner the app */

func (repo *AppRepository) CheckAppByOwner(id string, owner string) (*DevApp, error) {
	var app DevApp
	err := repo.DB.Where("id = ? ", id).Where("owner_id = ?", owner).Take(&app).Error
	if err != nil {
		return nil, err
	}
	return &app, nil
}

func (repo *AppRepository) ListUserConsentsByApp(app_id string, offset int, limit int) ([]CustomAppUser, error) {
	var users []CustomAppUser
	if err := repo.DB.Model(AppConsent{}).Order("users.username").Limit(limit).Offset(offset).Select("users.id, users.username, app_consents.attributes, app_consents.status, app_consents.uat").Joins("JOIN users ON users.id = app_consents.user_id").Where("app_consents.app_id = ?", app_id).Scan(&users).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return users, nil
		}
		return nil, err
	}
	return users, nil
}

func (repo *AppRepository) CountUserConsentsByApp(app_id string) (int64, error) {
	var count int64
	if err := repo.DB.Model(AppConsent{}).Where("app_consents.app_id = ?", app_id).Count(&count).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return 0, nil
		}
		return 0, err
	}
	return count, nil
}

/**
* App Integration section - supporting Webflow integration
 */

func (repo *AppRepository) GetIntegrationByAppId(app_id string, vendor string) (*AppIntegration, error) {
	var app AppIntegration
	err := repo.DB.Where("app_id = ? ", app_id).Take(&app).Error
	if err != nil {
		return nil, err
	}
	return &app, nil
}

func (repo *AppRepository) CreateIntegration(a *AppIntegration) error {

	tx := repo.DB.Begin()

	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	if err := tx.Error; err != nil {
		return err
	}

	if a.ID == "" {
		a.ID = uuid.New().String()
	}

	if err := tx.Create(&a).Error; err != nil {
		tx.Rollback()
		return err
	}

	return tx.Commit().Error
}

func (repo *AppRepository) UpdateIntegration(a *AppIntegration) error {

	tx := repo.DB.Begin()

	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	if err := tx.Error; err != nil {
		return err
	}

	if err := tx.Save(&a).Error; err != nil {
		tx.Rollback()
		return err
	}

	return tx.Commit().Error
}
