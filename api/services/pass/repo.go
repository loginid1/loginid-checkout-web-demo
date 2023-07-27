package pass

import (
	"strings"

	"gorm.io/gorm"
)

type PassRepository struct {
	DB *gorm.DB
}

func (r *PassRepository) Create(model UserPass) error {
	if err := r.DB.Create(&model).Error; err != nil {
		return err
	}
	return nil
}

func (r *PassRepository) ListByUsername(username string) ([]UserPass, error) {
	var result []UserPass
	if err := r.DB.Model(UserPass{}).Preload("Consent.DevApp").Select("user_passes.*").Joins("JOIN users ON users.id = user_passes.user_id").Where("users.username_lower = ?", strings.ToLower(username)).Order("expires_at NULLS FIRST, created_at ASC").Find(&result).Error; err != nil {
		return nil, err
	}

	return result, nil
}

func (r *PassRepository) ListByUserID(userid string) ([]UserPass, error) {
	var result []UserPass
	if err := r.DB.Model(UserPass{}).Select("user_passes.*").Where("user_id", userid).Find(&result).Error; err != nil {
		return nil, err
	}

	return result, nil
}

func (r *PassRepository) ListByIDs(userId string, ids []string) ([]UserPass, error) {
	var result []UserPass
	if err := r.DB.Model(UserPass{}).Where("user_id", userId).Where(ids).Find(&result).Error; err != nil {
		return nil, err
	}

	return result, nil
}

func (r *PassRepository) DeleteByID(id string) error {
	return r.DB.Where("id = ?", id).Delete(&UserPass{}).Error
}
