package user

import (
	"fmt"

	"github.com/algorand/go-algorand-sdk/crypto"
	"github.com/algorand/go-algorand-sdk/mnemonic"
	"gitlab.com/loginid/software/services/loginid-vault/services"
	"gorm.io/gorm"
)

type UserService struct {
	UserRepository *UserRepository
}

// NewUserService
// initialize UserService struct
func NewUserService(db *gorm.DB) (*UserService, error) {

	userService := UserService{UserRepository: &UserRepository{DB: db}}
	return &userService, nil
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

func (u *UserService) AddUserCredential(username string, device_name string, public_key string, key_alg string) *services.ServiceError {

	credential := UserCredential{
		Name:      device_name,
		PublicKey: public_key,
		KeyAlg:    key_alg,
	}
	err := u.UserRepository.AddUserCredential(username, credential)
	if err != nil {
		return services.CreateError("failed to register credential")
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

// create a backup recovery in ed25519 format (same as algorand account)
// return mnemonic phrases
func (u *UserService) CreateRecovery(username string) (string, *UserRecovery, *services.ServiceError) {
	account := crypto.GenerateAccount()
	fmt.Printf("account address: %s\n", account.Address)

	m, err := mnemonic.FromPrivateKey(account.PrivateKey)
	if err != nil {
		return "", nil, services.CreateError("failed to generate recovery")
	}

	// store address (public key ) to user database
	recovery := UserRecovery{PublicKey: account.Address.String()}

	err = u.UserRepository.SaveRecovery(username, recovery)
	if err != nil {
		return "", nil, services.CreateError("failed to create recovery")
	}

	fmt.Printf("backup phrase = %s\n", m)
	return m, &recovery, nil
}

func (u *UserService) GetRecoveryList(username string) ([]UserRecovery, *services.ServiceError) {
	recoveryList, err := u.UserRepository.GetRecoveryByUsername(username)
	if err != nil {
		return recoveryList, services.CreateError("failed to retrieve recovery list - try again")
	}

	return recoveryList, nil
}
