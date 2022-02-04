package algo

import (
	"errors"

	"github.com/google/uuid"
	"gitlab.com/loginid/software/services/loginid-vault/services/user"
	"gorm.io/gorm"
)

type AlgoRepository struct {
	DB *gorm.DB
}

func (repo *AlgoRepository) LookupAddress(address string) bool {
	var algoAccount AlgoAccount
	err := repo.DB.Where("address = ? ", address).Take(&algoAccount).Error
	return err == nil
}

func (repo *AlgoRepository) AddAlgoAccount(username string, account *AlgoAccount) error {
	tx := repo.DB.Begin()

	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	if err := tx.Error; err != nil {
		return err
	}

	var user user.User
	if err := tx.Where("username = ?", username).Take(&user).Error; err != nil {
		return err
	}

	if user.ID == "" {
		return errors.New("no user found")
	}

	account.User = user
	if account.ID == "" {
		account.ID = uuid.New().String()
	}
	if err := tx.Create(&account).Error; err != nil {
		tx.Rollback()
		return err
	}

	return tx.Commit().Error
}

func (repo *AlgoRepository) GetAccountList(username string) ([]AlgoAccount, error) {

	var accounts []AlgoAccount
	err := repo.DB.Joins("JOIN users ON users.id = algo_accounts.user_id").Where("users.username = ? ", username).Find(&accounts).Error
	if err != nil {
		return accounts, err
	}
	return accounts, nil
}
