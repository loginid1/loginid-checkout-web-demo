package user

import (
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/go-redis/redis"
	logger "gitlab.com/loginid/software/libraries/goutil.git/logger"
	"gitlab.com/loginid/software/services/loginid-vault/services"
	"gorm.io/gorm"
)

type UserService struct {
	RedisCache     *redis.Client
	UserRepository *UserRepository
}

// NewUserService
// initialize UserService struct
func NewUserService(db *gorm.DB, redisCache *redis.Client) (*UserService, error) {

	userService := UserService{RedisCache: redisCache, UserRepository: &UserRepository{DB: db}}
	return &userService, nil
}

func (u *UserService) CreatePendingUser(username string, device_name string, public_key string, alg string) (*PendingUser, *services.ServiceError) {

	// check db to make sure no exisiting username
	// check redis to make sure no pending username
	key := fmt.Sprintf("user::pending::%s", strings.ToLower(username))
	val, _ := u.RedisCache.Get(key).Result()
	if val != "" {
		return nil, &services.ServiceError{Message: "username is unavailable"}
	}

	// create pending user
	pUser := PendingUser{Username: username, PublicKey: public_key, DeviceName: device_name}

	value, err := json.Marshal(pUser)
	if err != nil {
		return nil, services.CreateError("registration error")
	}

	err = u.RedisCache.Set(key, value, 2*time.Minute).Err()
	if err != nil {
		logger.Global.Error(err.Error())
		return nil, services.CreateError("registration error")
	}
	return &pUser, nil
}

func (u *UserService) GetPendingUser(username string) (*PendingUser, *services.ServiceError) {
	// check redis to make sure pending user existed
	key := fmt.Sprintf("user::pending::%s", strings.ToLower(username))
	value, err := u.RedisCache.Get(key).Result()
	if err != nil {
		return nil, services.CreateError("no user")
	}
	var pUser PendingUser
	json.Unmarshal([]byte(value), &pUser)
	if err != nil {
		return nil, services.CreateError("no user")
	}
	return &pUser, nil
}

func (u *UserService) CreateUserAccount(username string, device_name string, public_key string, key_alg string) *services.ServiceError {
	user := User{
		Username: username,
	}
	credential := UserCredential{
		Name:      device_name,
		PublicKey: public_key,
		KeyAlg:    key_alg,
	}
	err := u.UserRepository.CreateAccount(user, credential)
	if err != nil {
		return services.CreateError("failed to create account")
	}
	return nil
}

func (u *UserService) GetProfile(username string) (*UserProfile, *services.ServiceError) {
	// placeHolder for now
	profile := &UserProfile{
		NumCredential:  1,
		NumRecovery:    1,
		NumAlgorand:    0,
		RecentActivity: "Login at XXXXXXX time",
	}
	return profile, nil
}

func (u *UserService) GetCredentialList(username string) ([]UserCredential, *services.ServiceError) {
	credentialList, err := u.UserRepository.GetCredentialsByUsername(username)
	if err != nil {
		return credentialList, services.CreateError("failed to retrieve credentials - try again")
	}

	return credentialList, nil
}
