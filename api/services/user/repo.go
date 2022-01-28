package user

import (
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type UserRepository struct {
	DB *gorm.DB
}

func (repo *UserRepository) CreateAccount(user User, credential UserCredential) error {

	tx := repo.DB.Begin()

	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	if err := tx.Error; err != nil {
		return err
	}

	if user.ID == "" {
		user.ID = uuid.New().String()
	}

	if err := tx.Create(&user).Error; err != nil {
		tx.Rollback()
		return err
	}

	if credential.ID == "" {
		credential.ID = uuid.New().String()
	}
	credential.User = user
	if err := tx.Create(&credential).Error; err != nil {
		tx.Rollback()
		return err
	}

	return tx.Commit().Error
}

func (repo *UserRepository) GetCredentialsByUsername(username string) ([]UserCredential, error) {

	var credentials []UserCredential
	err := repo.DB.Joins("JOIN users ON users.id = user_credentials.user_id").Where("users.username = ? ", username).Find(&credentials).Error
	if err != nil {
		return credentials, err
	}
	return credentials, nil
}
