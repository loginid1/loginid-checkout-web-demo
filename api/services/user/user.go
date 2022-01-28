package user

import "time"

type PendingUser struct {
	Username   string
	PublicKey  string
	KeyAlg     string
	DeviceName string
}

type User struct {
	ID            string    `json:"id" gorm:"primary_key"`
	Username      string    `json:"username" gorm:"not null"`
	UsernameLower string    `json:"username_lower" gorm:"->;type:varchar GENERATED ALWAYS AS (lower(username)) STORED;default:(-)"`
	Iat           time.Time `json:"iat" gorm:"DEFAULT:current_timestamp"`
}

// public key format x509
// alg ecc 256
type UserCredential struct {
	ID        string    `json:"id" gorm:"primary_key"`
	UserID    string    `json:"user_id"`
	User      User      `json:"-"`
	Name      string    `json:"name"`
	KeyHandle string    `json:"key_handle"`
	PublicKey string    `json:"public_key"`
	KeyAlg    string    `json:"key_alg"`
	Iat       time.Time `json:"iat" gorm:"DEFAULT:current_timestamp"`
}

// public key is hash address sha512_256 of ed25519 public key
type UserRecovery struct {
	ID        string    `json:"id" gorm:"primary_key"`
	UserID    string    `json:"user_id"`
	User      User      `json:"-"`
	PublicKey string    `json:"public_key"`
	Iat       time.Time `json:"iat" gorm:"DEFAULT:current_timestamp"`
}

type UserProfile struct {
	NumCredential  int32  `json:"num_credential"`
	NumRecovery    int32  `json:"num_recovery"`
	NumAlgorand    int32  `json:"num_algorand"`
	RecentActivity string `json:"recent_activity"`
}
