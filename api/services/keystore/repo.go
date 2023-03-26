package keystore

import (
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type KeystoreRepository struct {
	DB *gorm.DB
}

func NewKeystoreRepository(db *gorm.DB) *KeystoreRepository {
	return &KeystoreRepository{DB: db}
}

// CreateKeystore
func (repo *KeystoreRepository) CreateKeystore(ks *Keystore) error {

	tx := repo.DB.Begin()

	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	if err := tx.Error; err != nil {
		return err
	}

	if ks.ID == "" {
		ks.ID = uuid.New().String()
	}

	if err := tx.Create(&ks).Error; err != nil {
		tx.Rollback()
		return err
	}

	return tx.Commit().Error
}

func (repo *KeystoreRepository) GetKeystoreByID(id string) (*Keystore, error) {
	var keystore Keystore
	err := repo.DB.Where("id = ? ", id).Take(&keystore).Error
	if err != nil {
		return nil, err
	}
	return &keystore, nil
}

func (repo *KeystoreRepository) GetKeystoreByScope(scope int32, status int32, kstype string) (*Keystore, error) {
	var keystore Keystore
	err := repo.DB.Where("scope = ? ", scope).Where("status = ?", status).Where("keystore_type =?", kstype).Take(&keystore).Error
	if err != nil {
		return nil, err
	}
	return &keystore, nil
}
