package algo

import (
	"time"

	"gitlab.com/loginid/software/services/loginid-vault/services/user"
)

type AlgoAccount struct {
	ID              string    `json:"id" gorm:"primary_key"`
	UserID          string    `json:"user_id"`
	User            user.User `json:"-"`
	Alias           string    `json:"alias"`
	Address         string    `json:"address"`
	TealScript      string    `json:"teal_script"`
	CompileScript   string    `json:"compile_script"`
	Credentials     string    `json:"credentials"`
	RecoveryAddress string    `json:"recovery_address"`
	AccountStatus   string    `json:"account_status"`
	Iat             time.Time `json:"iat" gorm:"DEFAULT:current_timestamp"`
	Uat             time.Time `json:"uat" gorm:"DEFAULT:current_timestamp"`
}
