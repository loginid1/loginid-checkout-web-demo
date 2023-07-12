package pass

import (
	"context"
	"crypto/sha256"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
	"gitlab.com/loginid/software/libraries/goutil.git"
	"gitlab.com/loginid/software/libraries/goutil.git/logger"
	"gitlab.com/loginid/software/services/loginid-vault/services"
	"gitlab.com/loginid/software/services/loginid-vault/services/app"
	notification "gitlab.com/loginid/software/services/loginid-vault/services/notification/providers"
	"gitlab.com/loginid/software/services/loginid-vault/services/user"
	"gitlab.com/loginid/software/services/loginid-vault/specs"
	"gitlab.com/loginid/software/services/loginid-vault/utils"
	"gorm.io/gorm"
)

type PassService struct {
	Repository          *PassRepository
	UserService         *user.UserService
	RedisClient         *redis.Client
	NotificationService notification.ProviderInterface
}

type PassResponse struct {
	ID         string         `json:"id"`
	UserID     string         `json:"user_id"`
	Name       string         `json:"name"`
	Attributes string         `json:"attributes"`
	SchemaType PassSchemaType `json:"schema"`
	Issuer     string         `json:"issuer"`
	Data       string         `json:"data"`
	CreatedAt  time.Time      `json:"created_at"`
	ExpiresAt  *time.Time     `json:"expires_at,omitempty"`
}

var ISSUER_NAME = goutil.GetEnv("ISSUER_NAME", "LoginID Wallet")

func NewPassService(db *gorm.DB, redis *redis.Client, notification_service notification.ProviderInterface) *PassService {
	userService, _ := user.NewUserService(db)
	return &PassService{
		Repository:          &PassRepository{DB: db},
		UserService:         userService,
		RedisClient:         redis,
		NotificationService: notification_service,
	}
}

func (s *PassService) List(ctx context.Context, username string) ([]interface{}, *services.ServiceError) {
	passes, err := s.Repository.ListByUsername(username)
	if err != nil {
		return nil, services.CreateError("failed to list user passes")
	}

	response := []interface{}{}
	for _, pass := range passes {
		item := PassResponse{
			ID:         pass.ID,
			UserID:     pass.UserID,
			Name:       pass.Name,
			Attributes: pass.Attributes,
			SchemaType: pass.SchemaType,
			Data:       pass.MaskedData,
			Issuer:     pass.Issuer,
			CreatedAt:  pass.CreatedAt,
			ExpiresAt:  pass.ExpiresAt,
		}

		response = append(response, item)
	}

	return response, nil
}

func (s *PassService) Delete(ctx context.Context, id string) *services.ServiceError {
	if err := s.Repository.DeleteByID(id); err != nil {
		return services.CreateError("failed to delete user passes")
	}

	return nil
}

func (s *PassService) PhoneInit(ctx context.Context, username, phone_number string) *services.ServiceError {
	// Generates a random code
	//code, err := utils.GenerateRandomString(3)
	//if err != nil {
	//	return services.CreateError("failed to generate verification code")
	//}
	//code = strings.ToUpper(code)

	// Send the code via SMS
	//msg := fmt.Sprintf("Your Pass verification code is: %s", code)
	sid, err := s.NotificationService.SendCode(phone_number)
	if err != nil || sid == "" {
		logger.ForContext(ctx).Error(err.Error())
		return services.CreateError("failed to send verification code")
	}
	//Store the code in redis using the user session
	s.RedisClient.Set(ctx, getCacheKey(phone_number, username), sid, 300*time.Second)

	return nil
}

func (s *PassService) PhoneComplete(ctx context.Context, username, name, phone_number, code string) *services.ServiceError {
	// Retrive the code from redis using the user session
	key := getCacheKey(phone_number, username)
	redisData := s.RedisClient.Get(ctx, key)

	// Check if we have a valid code
	if redisData == nil {
		return services.CreateError("invalid 'phone number' and/or 'code'")
	}

	result, err := s.NotificationService.VerifyCode(redisData.Val(), code)
	if err != nil {
		logger.ForContext(ctx).Error(err.Error())
		return services.CreateError("verification failed")
	}
	if !result {
		return services.CreateError("invalid 'phone number' and/or 'code'")
	}

	usr, svcErr := s.UserService.GetUser(username)
	if svcErr != nil {
		return svcErr
	}

	phoneData := PhonePassSchema{
		PhoneNumber: phone_number,
	}
	data, err := json.Marshal(&phoneData)
	if err != nil {
		return services.CreateError("failed to create a new phone pass")
	}
	dataHash := sha256.Sum256(data)

	keyId, encryptedData, err := services.EncryptWithOwnerID(ctx, "loginid.io", string(data))
	if err != nil {
		return services.CreateError("failed to encrypt the phone pass")
	}

	maskedData, err := utils.MaskData(phone_number, 3, 4)
	if err != nil {
		return services.CreateError(err.Error())
	}

	// Code verification check is complete, procede to create the phone pass
	pass := UserPass{
		ID:         uuid.NewString(),
		UserID:     usr.ID,
		Name:       name,
		Attributes: app.KPhoneAttribute,
		SchemaType: PhonePassSchemaType,
		Issuer:     ISSUER_NAME,
		KeyId:      keyId,
		Data:       encryptedData,
		DataHash:   dataHash[:],
		MaskedData: maskedData,
		CreatedAt:  time.Now(),
		UpdatedAt:  time.Now(),
		ExpiresAt:  nil,
	}
	if err := s.Repository.Create(pass); err != nil {
		return services.CreateError("failed to create a new phone pass")
	}

	// Delete the code from redis after the verification is done and the pass is created
	s.RedisClient.Del(ctx, key)

	return nil
}

type DriversLicensePass struct {
	DocumentNumber   string     `json:"document_number" validate:"required"`
	DocumentCountry  string     `json:"document_country,omitempty"`
	PersonalIdNumber string     `json:"personal_id_number,omitempty"`
	FullName         string     `json:"full_name,omitempty"`
	Address          string     `json:"address,omitempty"`
	DateOfBirth      time.Time  `json:"date_of_birth" validate:"required"`
	DateOfIssue      *time.Time `json:"date_of_issue,omitempty"`
	DateOfExpiry     *time.Time `json:"date_of_expiry,omitempty"`
}

func (s *PassService) AddDriversLicensePass(ctx context.Context, userId, credentialId, name string, data DriversLicensePass) *services.ServiceError {
	dataBytes, err := json.Marshal(&data)
	if err != nil {
		return services.CreateError("failed to create a new pass")
	}
	dataHash := sha256.Sum256([]byte(data.DocumentNumber))

	attributes := []string{"drivers-license", "document_number", "date_of_birth"}
	if data.DocumentCountry != "" {
		attributes = append(attributes, "document_country")
	}

	if data.PersonalIdNumber != "" {
		attributes = append(attributes, "personal_id_number")
	}

	if data.FullName != "" {
		attributes = append(attributes, "full_name")
	}

	if data.Address != "" {
		attributes = append(attributes, "address")
	}

	if data.DateOfIssue != nil {
		attributes = append(attributes, "date_of_issue")
	}

	if data.DateOfExpiry != nil {
		attributes = append(attributes, "date_of_expiry")
	}

	keyId, encryptedData, err := services.EncryptWithOwnerID(ctx, "loginid.io", string(dataBytes))
	if err != nil {
		return services.CreateError("failed to encrypt the phone pass")
	}

	maskedData, err := utils.MaskData(data.DocumentNumber, 2, 3)
	if err != nil {
		return services.CreateError(err.Error())
	}

	pass := UserPass{
		ID:         credentialId,
		UserID:     userId,
		Name:       name,
		Attributes: strings.Join(attributes, ","),
		SchemaType: DriversLicensePassSchemaType,
		Issuer:     ISSUER_NAME,
		KeyId:      keyId,
		Data:       encryptedData,
		DataHash:   dataHash[:],
		MaskedData: maskedData,
		CreatedAt:  time.Now(),
		UpdatedAt:  time.Now(),
		ExpiresAt:  data.DateOfExpiry,
	}
	if err := s.Repository.Create(pass); err != nil {
		return services.CreateError("failed to create a new drivers license pass")
	}
	return nil
}

func (s *PassService) ForceAddPass(ctx context.Context, userId, name, attributes, maskedData string, schema PassSchemaType, data interface{}) *services.ServiceError {
	dataBytes, err := json.Marshal(&data)
	if err != nil {
		return services.CreateError("failed to create a new pass")
	}
	dataHash := sha256.Sum256(dataBytes)

	keyId, encryptedData, err := services.EncryptWithOwnerID(ctx, "loginid.io", string(dataBytes))
	if err != nil {
		logger.ForContext(ctx).Error(err.Error())
		return services.CreateError("failed to encrypt pass")
	}

	pass := UserPass{
		ID:         uuid.NewString(),
		UserID:     userId,
		Name:       name,
		Attributes: attributes,
		SchemaType: schema,
		Issuer:     ISSUER_NAME,
		KeyId:      keyId,
		Data:       encryptedData,
		DataHash:   dataHash[:],
		MaskedData: maskedData,
		CreatedAt:  time.Now(),
		UpdatedAt:  time.Now(),
		ExpiresAt:  nil,
	}
	if err := s.Repository.Create(pass); err != nil {
		return services.CreateError("failed to create a new pass")
	}
	return nil
}

func (s *PassService) GetPassesByUserID(ctx context.Context, user_id string, attributes string) ([]UserPass, *services.ServiceError) {
	passes, err := s.Repository.ListByID(user_id)
	if err != nil {
		logger.ForContext(ctx).Error(err.Error())
		return passes, services.CreateError("error - no passes found")
	}

	var mypasses []UserPass
	for _, pass := range passes {
		if compareAttributes(attributes, pass.Attributes) {
			mypasses = append(mypasses, pass)
		}
	}
	return mypasses, nil

}

func (s *PassService) GenerateW3C(ctx context.Context, passes []UserPass) ([]specs.W3cClaims, *services.ServiceError) {
	var claims []specs.W3cClaims
	const meta_url = "https://api.wallet.loginid.io"

	var vcSubject interface{}
	for _, pass := range passes {
		did := fmt.Sprintf("did:loginid:%s", pass.ID)
		if pass.SchemaType == PhonePassSchemaType {
			data, err := services.DecryptWithOwnerID(ctx, "loginid.io", pass.KeyId, pass.Data)
			if err != nil {
				return claims, services.CreateError("fail to decrypt pass info")
			}
			var phone PhonePassSchema
			err = json.Unmarshal([]byte(data), &phone)
			if err != nil {
				return claims, services.CreateError("fail to extract pass info")
			}
			vcSubject = specs.PhoneCredential{
				ID:    did,
				Type:  "phone",
				Phone: phone.PhoneNumber,
			}
		} else if pass.SchemaType == EmailPassSchemaType {
			data, err := services.DecryptWithOwnerID(ctx, "loginid.io", pass.KeyId, pass.Data)
			if err != nil {
				return claims, services.CreateError("fail to decrypt pass info")
			}
			var email EmailPassSchema
			err = json.Unmarshal([]byte(data), &email)
			if err != nil {
				return claims, services.CreateError("fail to extract pass info")
			}
			vcSubject = specs.EmailCredential{
				ID:    did,
				Type:  "email",
				Email: email.Email,
			}
		}

		if vcSubject != nil {
			random, _ := utils.GenerateRandomString(16)
			claim := specs.W3cClaims{
				VC: specs.VerifiableCredential{
					Context:           specs.KW3cContext,
					ID:                fmt.Sprintf("%s/user/%s", meta_url, pass.UserID),
					Issuer:            pass.Issuer,
					IssuanceDate:      pass.CreatedAt.Format(time.RFC3339),
					CredentialSubject: vcSubject,
					Type:              []string{string(pass.SchemaType)},
					Iss:               pass.Issuer,
					Nbf:               time.Now().Format(time.RFC3339),
					Jti:               random,
					Sub:               did,
				},
			}

			claims = append(claims, claim)

		}
	}
	return claims, nil
}

func compareAttributes(required_attrs string, pass_attrs string) bool {
	reqs := strings.Split(required_attrs, ",")
	p_attrs := strings.Split(pass_attrs, ",")

	for _, r_attr := range reqs {
		for _, p_attr := range p_attrs {
			if r_attr == p_attr {
				return true
			}
		}
	}
	return false
}

func getCacheKey(phone_number, user_id string) string {
	return fmt.Sprintf("passes::phone::%x::%s", sha256.Sum256([]byte(phone_number)), user_id)
}
