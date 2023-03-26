package keystore

import "time"

const (
	ksStatusActive   = 2
	ksStatusExpiring = 1
	ksStatusDisable  = 0
)

const (
	ksScopeSign    = 2
	ksScopeSession = 1
	ksSignID       = "SIGN"
	ksSessionID    = "SESSION"
)

type Keystore struct {
	ID           string    `json:"id" gorm:"primary_key"`
	PrivateKey   string    `json:"private_key" gorm:"not null" `
	PublicKey    string    `json:"public_key" gorm:"not null"`
	Alg          string    `json:"alg" gorm:"not null"`
	KeystoreType string    `json:"keystore_type" gorm:"not null"`
	Scope        int32     `json:"scope" gorm:"not null" `
	Status       int32     `json:"status" gorm:"not null"`
	Iat          time.Time `json:"iat" gorm:"DEFAULT:current_timestamp"`
}
