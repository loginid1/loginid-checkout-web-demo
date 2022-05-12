package algo

import (
	"errors"
	"strings"

	"github.com/google/uuid"
	"gitlab.com/loginid/software/libraries/goutil.git/logger"
	"gitlab.com/loginid/software/services/loginid-vault/services/user"
	"gorm.io/gorm"
)

type AlgoRepository struct {
	DB *gorm.DB
}

func (repo *AlgoRepository) LookupAddress(address string) (*AlgoAccount, error) {
	var algoAccount AlgoAccount
	err := repo.DB.Where("address = ? ", address).Take(&algoAccount).Error
	if err != nil {
		return nil, err
	}
	return &algoAccount, nil
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
	if err := tx.Where("username_lower = ?", strings.ToLower(username)).Take(&user).Error; err != nil {
		tx.Rollback()
		return err
	}

	if user.ID == "" {
		tx.Rollback()
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
	err := repo.DB.Joins("JOIN users ON users.id = algo_accounts.user_id").Where("users.username_lower = ? ", strings.ToLower(username)).Find(&accounts).Error
	if err != nil {
		return accounts, err
	}
	return accounts, nil
}

func (repo *AlgoRepository) GetAccountByAddress(address string) (*AlgoAccount, error) {

	var account AlgoAccount
	err := repo.DB.Where("algo_accounts.address=?", address).Take(&account).Error
	if err != nil {
		return nil, err
	}
	return &account, nil
}

func (repo *AlgoRepository) CheckOriginPermission(address string, origin string, network string) (*user.User, error) {

	var user user.User
	err := repo.DB.Where("enable_accounts.wallet_address = ? ", address).
		Where("enable_accounts.dapp_origin = ? ", origin).
		Where("enable_accounts.network=?", network).
		Joins("JOIN enable_accounts ON users.id = enable_accounts.user_id").
		Take(&user).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (repo *AlgoRepository) AddEnableAccount(enable EnableAccount) error {
	tx := repo.DB.Begin()

	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}

	}()

	if err := tx.Error; err != nil {
		return err
	}

	// ignore duplicate record
	var found EnableAccount
	tx.Where("wallet_address=?", enable.WalletAddress).Where("dapp_origin=?", enable.DappOrigin).Where("network=?", enable.Network).Take(&found)
	if found.ID != "" {
		tx.Rollback()
		return nil
	}

	if enable.ID == "" {
		enable.ID = uuid.New().String()
	}
	if err := tx.Create(&enable).Error; err != nil {
		tx.Rollback()
		return err
	}

	return tx.Commit().Error
}

func (repo *AlgoRepository) GetEnableAccountList(username string) ([]EnableAccount, error) {

	var accounts []EnableAccount
	err := repo.DB.Joins("JOIN users ON users.id = enable_accounts.user_id").Where("users.username_lower = ? ", strings.ToLower(username)).Find(&accounts).Error
	if err != nil {
		return accounts, err
	}
	return accounts, nil
}

func (repo *AlgoRepository) revokeEnableAccount(ID string) error {
	tx := repo.DB.Begin()

	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}

	}()

	if err := tx.Error; err != nil {
		return err
	}

	var found EnableAccount
	if err := tx.Where("enable_accounts.id = ?", ID).
		Delete(&found).Error; err != nil {
		tx.Rollback()
		return err
	}

	if err := tx.Where("enable_accounts.id = ?", ID).Take(&found).Error; err != nil {

		logger.Global.Info("HELLO")
		logger.Global.Info(found.ID)

	}

	return tx.Commit().Error

}
