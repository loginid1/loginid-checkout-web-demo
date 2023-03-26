package app

import (
	"github.com/google/uuid"
	"gorm.io/gorm"
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

	if err := tx.Create(&consent).Error; err != nil {
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

func (repo *AppRepository) GetConsent(appid string, userid string) (*AppConsent, error) {
	var consent AppConsent
	err := repo.DB.Where("app_id = ? ", appid).Where("user_id = ?", userid).Take(&consent).Error
	if err != nil {
		return nil, err
	}
	return &consent, nil
}
