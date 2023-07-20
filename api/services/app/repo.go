package app

import (
	"strings"

	"github.com/google/uuid"
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

func (repo *AppRepository) CreateConsent(consent *AppConsent) error {

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
		Columns:   []clause.Column{{Name: "app_id"}, {Name: "user_id"}, {Name: "pass_id"}}, // key colume
		DoUpdates: clause.AssignmentColumns([]string{"attributes", "uat"}),                 // column needed to be updated
	}).Create(&consent).Error; err != nil {
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

func (repo *AppRepository) GetConsentPassesByAppID(appid string, userid string) ([]AppConsent, error) {
	var consent []AppConsent
	err := repo.DB.Joins("JOIN user_passes ON app_consents.pass_id = user_passes.id").Where("app_consents.user_id = ?", userid).Where("app_consents.app_id = ? ", appid).Find(&consent).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			// return empty record
			return consent, nil
		}
		return nil, err
	}
	return consent, nil
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
