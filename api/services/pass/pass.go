package pass

import (
	"time"
)

type PassSchemaType string

const (
	PhonePassSchemaType          PassSchemaType = "phone"
	EmailPassSchemaType          PassSchemaType = "email"
	DriversLicensePassSchemaType PassSchemaType = "drivers-license"
)

type DevApp struct {
	ID      string `gorm:"column:id;primaryKey"`
	OwnerID string `gorm:"column:owner_id;not null"`
	AppName string `gorm:"column:app_name;not null"`
}

type PassConsent struct {
	UserID     string    `gorm:"cloumn:user_id"`
	DevAppID   string    `gorm:"column:app_id"`
	DevApp     DevApp    `gorm:"foreignKey:DevAppID;references:ID"`
	UserPassID string    `gorm:"column:pass_id"`
	UserPass   UserPass  `gorm:"foreignKey:UserPassID;references:ID"`
	Schema     string    `gorm:"column:schema"`
	CreatedAt  time.Time `gorm:"column:created_at"`
	UpdatedAt  time.Time `gorm:"column:updated_at"`
}

type UserPass struct {
	ID         string         `gorm:"column:id;primaryKey;not null"`
	UserID     string         `gorm:"column:user_id;index;not null"`
	Name       string         `gorm:"column:name;not null"`
	Attributes string         `gorm:"column:attributes;not null"`
	SchemaType PassSchemaType `gorm:"column:schema;index;not null"`
	Issuer     string         `gorm:"column:issuer;not null"`
	KeyId      string         `gorm:"column:key_id"`
	Data       []byte         `gorm:"column:data"`
	DataHash   []byte         `gorm:"column:data_hash"`
	MaskedData string         `gorm:"column:masked_data"`
	CreatedAt  time.Time      `gorm:"column:created_at;not null; DEFAULT:current_timestamp"`
	UpdatedAt  time.Time      `gorm:"column:updated_at;not null; DEFAULT:current_timestamp"`
	ExpiresAt  *time.Time     `gorm:"column:expires_at"`
	Consent    []PassConsent
}

type PhonePassSchema struct {
	PhoneNumber string `json:"phone_number"`
}
type EmailPassSchema struct {
	Email string `json:"email"`
}

type DriversLicenseSchema struct {
	DocumentNumber   string     `json:"document_number" validate:"required"`
	DocumentCountry  string     `json:"document_country,omitempty"`
	PersonalIdNumber string     `json:"personal_id_number,omitempty"`
	FullName         string     `json:"full_name,omitempty"`
	Address          string     `json:"address,omitempty"`
	DateOfBirth      time.Time  `json:"date_of_birth" validate:"required"`
	DateOfIssue      *time.Time `json:"date_of_issue,omitempty"`
	DateOfExpiry     *time.Time `json:"date_of_expiry,omitempty"`
}
