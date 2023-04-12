package pass

import "time"

type PassSchemaType string

const (
	PhonePassSchemaType PassSchemaType = "phone"
	EmailPassSchemaType PassSchemaType = "email"
)

type UserPass struct {
	UserID     string         `gorm:"column:user_id;index;not null"`
	Attributes string         `gorm:"column:attributes;not null"`
	SchemaType PassSchemaType `gorm:"column:schema;index;not null"`
	Issuer     string         `gorm:"column:issuer;not null"`
	Data       []byte         `gorm:"column:data"`
	CreatedAt  time.Time      `gorm:"column:created_at;not null; DEFAULT:current_timestamp"`
	UpdatedAt  time.Time      `gorm:"column:updated_at;not null; DEFAULT:current_timestamp"`
	ExpiresAt  *time.Time     `gorm:"column:expires_at"`
}

type PhonePassSchema struct {
	Name        string `json:"name"`
	PhoneNumber string `json:"phone_number"`
}
