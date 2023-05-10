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
	if err := r.DB.Model(UserPass{}).Select("user_passes.*").Joins("JOIN users ON users.id = user_passes.user_id").Where("users.username_lower = ?", strings.ToLower(username)).Find(&result).Error; err != nil {
		return nil, err
	}

	return result, nil
}

func (r *PassRepository) ListByID(userid string) ([]UserPass, error) {
	var result []UserPass
	if err := r.DB.Model(UserPass{}).Select("user_passes.*").Where("user_id", userid).Find(&result).Error; err != nil {
		return nil, err
	}

	return result, nil
}
