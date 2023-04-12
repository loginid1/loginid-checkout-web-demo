package pass

import "gorm.io/gorm"

type PassRepository struct {
	DB *gorm.DB
}

func (r *PassRepository) Create(model UserPass) error {
	if err := r.DB.Create(&model).Error; err != nil {
		return err
	}
	return nil
}

func (r *PassRepository) List(user_id string) ([]UserPass, error) {
	var result []UserPass
	if err := r.DB.Where("user_id", user_id).Find(&result).Error; err != nil {
		return nil, err
	}

	return result, nil
}
