package user

import (
	"errors"

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

func (repo *UserRepository) AddUserCredential(username string, credential UserCredential) error {

	tx := repo.DB.Begin()

	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	if err := tx.Error; err != nil {
		return err
	}

	var user User
	if err := tx.Where("username = ?", username).Take(&user).Error; err != nil {
		return err
	}

	if user.ID == "" {
		return errors.New("no user found")
	}

	credential.User = user

	if credential.ID == "" {
		credential.ID = uuid.New().String()
	}
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

func (repo *UserRepository) LookupCredentials(username string, credential_ids []string) ([]UserCredential, error) {
	var credentials []UserCredential
	err := repo.DB.Joins("JOIN users ON users.id = user_credentials.user_id").Where("users.username = ? ", username).Where("user_credentials.id in ?", credential_ids).Find(&credentials).Error
	if err != nil {
		return credentials, err
	}
	return credentials, nil
}

func (repo *UserRepository) SaveRecovery(username string, recovery UserRecovery) error {

	tx := repo.DB.Begin()

	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	if err := tx.Error; err != nil {
		return err
	}

	var user User
	if err := tx.Where("username = ?", username).Take(&user).Error; err != nil {
		return err
	}

	recovery.UserID = user.ID
	if recovery.ID == "" {
		recovery.ID = uuid.New().String()
	}

	if err := tx.Create(&recovery).Error; err != nil {
		tx.Rollback()
		return err
	}

	return tx.Commit().Error
}

func (repo *UserRepository) GetRecoveryByUsername(username string) ([]UserRecovery, error) {

	var recovery []UserRecovery
	err := repo.DB.Joins("JOIN users ON users.id = user_recovery.user_id").Where("users.username = ? ", username).Find(&recovery).Error
	if err != nil {
		return recovery, err
	}
	return recovery, nil
}
