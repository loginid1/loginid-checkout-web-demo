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
	"gitlab.com/loginid/software/services/loginid-vault/services"
	notification "gitlab.com/loginid/software/services/loginid-vault/services/notification/providers"
	"gitlab.com/loginid/software/services/loginid-vault/services/user"
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
	UserID     string         `json:"user_id"`
	Name       string         `json:"name"`
	Attributes string         `json:"attributes"`
	SchemaType PassSchemaType `json:"schema"`
	Issuer     string         `json:"issuer"`
	Data       interface{}    `json:"data"`
	CreatedAt  time.Time      `json:"created_at"`
}

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

	// TODO: abstract the loop to handle other type of passes
	var response []interface{}
	for _, pass := range passes {
		item := PassResponse{
			UserID:     pass.UserID,
			Name:       pass.Name,
			Attributes: pass.Attributes,
			SchemaType: pass.SchemaType,
			Issuer:     pass.Issuer,
			CreatedAt:  pass.CreatedAt,
		}

		json.Unmarshal(pass.Data, &item.Data)
		response = append(response, item)
	}

	return response, nil
}

func (s *PassService) PhoneInit(ctx context.Context, username, phone_number string) *services.ServiceError {
	// Generates a random code
	code, err := utils.GenerateRandomString(3)
	if err != nil {
		return services.CreateError("failed to generate verification code")
	}
	code = strings.ToUpper(code)

	// Store the code in redis using the user session
	s.RedisClient.Set(ctx, getCacheKey(phone_number, username), code, 90*time.Second)

	// Send the code via SMS
	msg := fmt.Sprintf("Your Pass verification code is: %s", code)
	if err := s.NotificationService.Send(phone_number, msg); err != nil {
		return services.CreateError("failed to send verification code")
	}

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

	if redisData.Val() != code {
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

	// Code verification check is complete, procede to create the phone pass
	pass := UserPass{
		ID:         uuid.NewString(),
		UserID:     usr.ID,
		Name:       name,
		Attributes: "phone_number",
		SchemaType: PhonePassSchemaType,
		Issuer:     "LoginID Vault",
		Data:       data,
		DataHash:   dataHash[:],
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

func (s *PassService) ForceAddPass(ctx context.Context, userId, name, attributes string, schema PassSchemaType, data interface{}) *services.ServiceError {
	dataBytes, err := json.Marshal(&data)
	if err != nil {
		return services.CreateError("failed to create a new pass")
	}
	dataHash := sha256.Sum256(dataBytes)

	pass := UserPass{
		ID:         uuid.NewString(),
		UserID:     userId,
		Name:       name,
		Attributes: attributes,
		SchemaType: schema,
		Issuer:     "LoginID Vault",
		Data:       dataBytes,
		DataHash:   dataHash[:],
		CreatedAt:  time.Now(),
		UpdatedAt:  time.Now(),
		ExpiresAt:  nil,
	}
	if err := s.Repository.Create(pass); err != nil {
		return services.CreateError("failed to create a new phone pass")
	}
	return nil
}

func getCacheKey(phone_number, user_id string) string {
	return fmt.Sprintf("passes::phone::%x::%s", sha256.Sum256([]byte(phone_number)), user_id)
}
