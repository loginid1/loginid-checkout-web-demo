package algo

import (
	"time"

	"gitlab.com/loginid/software/services/loginid-vault/services/user"
)

const ALGO_PREFIX = "ALGO"

var ALGO_NETWORK = map[string]string{
	"mainnet": "ALGO_mainnet",
	"testnet": "ALGO_testnet",
	"sandnet": "ALGO_sandnet",
}

var ALGO_NETWORK_GENESIS = map[string]Genesis{
	"sandnet": {ID: "sandnet-v1", Hash: "kRzYkNRKXtnl6TyFvtrkAYO5wm17eMd0aXtDBRytVnQ="},
}

type Genesis struct {
	ID   string `json:"genesis_id"`
	Hash string `json:"genesis_hash"`
}

type AlgoAccount struct {
	ID              string                `json:"id" gorm:"primary_key"`
	UserID          string                `json:"user_id"`
	User            user.User             `json:"-"`
	Alias           string                `json:"alias"`
	Address         string                `json:"address"`
	TealScript      string                `json:"teal_script"`
	CompileScript   string                `json:"compile_script"`
	CredentialsPK   string                `json:"credentials_pk"`
	CredentialsID   string                `json:"credentials_id"`
	RecoveryAddress string                `json:"recovery_address"`
	AccountStatus   string                `json:"account_status"`
	Iat             time.Time             `json:"iat" gorm:"DEFAULT:current_timestamp"`
	Uat             time.Time             `json:"uat" gorm:"DEFAULT:current_timestamp"`
	Credentials     []user.UserCredential `gorm:"-"`
}

type EnableAccount struct {
	ID            string    `json:"id" gorm:"primary_key"`
	UserID        string    `json:"user_id"`
	User          user.User `json:"-"`
	WalletAddress string    `json:"wallet_address"`
	Network       string    `json:"network"`
	DappOrigin    string    `json:"dapp_origin"`
	Iat           time.Time `json:"iat" gorm:"DEFAULT:current_timestamp"`
}
