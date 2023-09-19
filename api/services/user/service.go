package user

import (
	"encoding/json"
	"fmt"
	"time"

	"github.com/algorand/go-algorand-sdk/crypto"
	"github.com/algorand/go-algorand-sdk/mnemonic"
	"github.com/google/uuid"
	"gitlab.com/loginid/software/services/loginid-vault/services"
	"gorm.io/gorm"
)

type UserService struct {
	UserRepository *UserRepository
}

type CredentialUserAgentResponse struct {
	Browser string `json:"browser"`
	Device  string `json:"device"`
	OS      string `json:"operating_system"`
}
type CredentialResponse struct {
	ID        string                       `json:"id"`
	UserID    string                       `json:"user_id"`
	UserAgent *CredentialUserAgentResponse `json:"user_agent,omitempty"`
	Name      string                       `json:"name"`
	KeyHandle string                       `json:"key_handle"`
	PublicKey string                       `json:"public_key"`
	KeyAlg    string                       `json:"key_alg"`
	Iat       time.Time                    `json:"iat"`
}

// NewUserService
// initialize UserService struct
func NewUserService(db *gorm.DB) (*UserService, error) {

	userService := UserService{UserRepository: &UserRepository{DB: db}}
	return &userService, nil
}

func (u *UserService) CreateUserAccount(username string, device_name string, device_info []byte, public_key string, key_alg string, scopes string, validatedEmail bool) (string, *services.ServiceError) {
	user := User{
		ID:             uuid.New().String(),
		Username:       username,
		EmailValidated: validatedEmail,
		Scopes:         scopes,
		Status:         KStatusFido,
	}

	if validatedEmail {
		user.Email = username
	}
	credential := UserCredential{
		Name:      device_name,
		UserAgent: device_info,
		PublicKey: public_key,
		KeyAlg:    key_alg,
	}
	err := u.UserRepository.CreateAccount(user, credential)
	if err != nil {
		return "", services.CreateError("failed to create account")
	}
	return user.ID, nil
}

func (u *UserService) CreateUserAccountWithoutFido(username string, scopes string, validatedEmail bool) (string, *services.ServiceError) {

	if !validatedEmail {
		return "", services.CreateError("invalid email")
	}

	user := User{
		ID:             uuid.New().String(),
		Username:       username,
		EmailValidated: validatedEmail,
		Scopes:         scopes,
		Status:         KStatusEmailOnly,
		Email:          username,
	}

	err := u.UserRepository.CreateUserWithoutCredential(user)
	if err != nil {
		return "", services.CreateError("failed to create account")
	}
	return user.ID, nil
}

func (u *UserService) AddUserCredential(username string, device_name string, device_info []byte, public_key string, key_alg string) *services.ServiceError {

	credential := UserCredential{
		Name:      device_name,
		UserAgent: device_info,
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

func (u *UserService) GetCredentialList(username string) ([]CredentialResponse, *services.ServiceError) {
	credentials, err := u.UserRepository.GetCredentialsByUsername(username)
	if err != nil {
		return nil, services.CreateError("failed to retrieve credentials - try again")
	}

	var result []CredentialResponse
	for _, credential := range credentials {
		var userAgent *CredentialUserAgentResponse
		json.Unmarshal(credential.UserAgent, &userAgent)
		item := CredentialResponse{
			ID:        credential.ID,
			UserID:    credential.UserID,
			Name:      credential.Name,
			UserAgent: userAgent,
			KeyHandle: credential.KeyHandle,
			PublicKey: credential.PublicKey,
			KeyAlg:    credential.KeyAlg,
			Iat:       credential.Iat,
		}
		result = append(result, item)
	}

	return result, nil
}

func (u *UserService) UpdateCredential(id string, name string) *services.ServiceError {
	if err := u.UserRepository.RenameCredential(id, name); err != nil {
		return services.CreateError("failed to rename credentials - try again")
	}

	return nil
}

func (u *UserService) GenerateRecoveryInit(username string) (string, *UserRecovery, *services.ServiceError) {
	account := crypto.GenerateAccount()
	fmt.Printf("account address: %s\n", account.Address)

	m, err := mnemonic.FromPrivateKey(account.PrivateKey)
	if err != nil {
		return "", nil, services.CreateError("failed to generate recovery")
	}

	recovery := UserRecovery{PublicKey: account.Address.String()}
	return m, &recovery, nil
}

func (u *UserService) GenerateRecoveryComplete(username string, public_key string) *services.ServiceError {

	// store address (public key ) to user database
	recovery := UserRecovery{PublicKey: public_key}

	err := u.UserRepository.SaveRecovery(username, recovery)
	if err != nil {
		return services.CreateError("failed to create recovery")
	}

	return nil
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

	return m, &recovery, nil
}

func (u *UserService) GetRecoveryList(username string) ([]UserRecovery, *services.ServiceError) {
	recoveryList, err := u.UserRepository.GetRecoveryByUsername(username)
	if err != nil {
		return recoveryList, services.CreateError("failed to retrieve recovery list - try again")
	}

	return recoveryList, nil
}

func (u *UserService) GetUser(username string) (*User, *services.ServiceError) {
	user, err := u.UserRepository.GetUserByUsername(username)
	if err != nil {
		return nil, services.CreateError("failed to retrieve user - try again")
	}

	return user, nil
}
