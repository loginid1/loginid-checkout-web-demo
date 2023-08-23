package user

import (
	"errors"
	"strings"

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

func (repo *UserRepository) CreateUserWithoutCredential(user User) error {

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

	return tx.Commit().Error
}

func (repo *UserRepository) UpdateScopes(username string, scope string) error {
	var user User
	return repo.DB.Model(&user).Where("username=?", username).Update("scopes", scope).Error
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
	if err := tx.Where("username_lower = ?", strings.ToLower(username)).Take(&user).Error; err != nil {
		tx.Rollback()
		return err
	}

	if user.ID == "" {
		tx.Rollback()
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
	err := repo.DB.Joins("JOIN users ON users.id = user_credentials.user_id").Where("users.username_lower = ? ", strings.ToLower(username)).Find(&credentials).Error
	if err != nil {
		return credentials, err
	}
	return credentials, nil
}

func (repo *UserRepository) LookupCredentials(username string, credential_ids []string) ([]UserCredential, error) {
	var credentials []UserCredential
	err := repo.DB.Joins("JOIN users ON users.id = user_credentials.user_id").Where("users.username_lower = ? ", strings.ToLower(username)).Where("user_credentials.id in ?", credential_ids).Find(&credentials).Error
	if err != nil {
		return credentials, err
	}
	return credentials, nil
}

func (repo *UserRepository) RenameCredential(credentialId string, name string) error {
	tx := repo.DB.Begin()

	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	if err := tx.Error; err != nil {
		return err
	}

	var credential UserCredential
	if err := tx.Where("user_credentials.id = ?", credentialId).Take(&credential).Error; err != nil {
		tx.Rollback()
		return err
	}

	if credential.ID == "" {
		tx.Rollback()
		return errors.New("no credential found")
	}

	if err := tx.Model(&credential).Update("name", name).Error; err != nil {
		tx.Rollback()
		return err
	}

	return tx.Commit().Error
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
	if err := tx.Where("username_lower = ?", strings.ToLower(username)).Take(&user).Error; err != nil {
		tx.Rollback()
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
	err := repo.DB.Joins("JOIN users ON users.id = user_recovery.user_id").Where("users.username_lower = ? ", strings.ToLower(username)).Find(&recovery).Error
	if err != nil {
		return recovery, err
	}
	return recovery, nil
}

func (repo *UserRepository) GetUserByUsername(username string) (*User, error) {

	var user User
	err := repo.DB.Where("users.username_lower = ? ", strings.ToLower(username)).Find(&user).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}
