package app

import "time"

const (
	kStatusActive   = 1
	ksStatusDisable = 0
)

const (
	KEmailAttribute = "email"
	KPhoneAttribute = "phone"
)

type AppSession struct {
	ID     string `json:"id"`
	AppID  string `json:"app_id"`
	UserID string `json:"user_id"`
	Origin string `json:"origin"`
	IP     string `json:"ip"`
	Method string `json:"method"`
}

type DevApp struct {
	ID         string    `json:"id" gorm:"primary_key"`
	OwnerID    string    `json:"owner_id" gorm:"not null" `
	AppName    string    `json:"app_name" gorm:"not null" `
	Origins    string    `json:"origins" gorm:"not null"`
	Attributes string    `json:"attributes" gorm:"not null"`
	Status     int32     `json:"status" gorm:"not null"`
	Iat        time.Time `json:"iat" gorm:"DEFAULT:current_timestamp"`
	Uat        time.Time `json:"uat" gorm:"DEFAULT:current_timestamp"`
}

type AppConsent struct {
	AppID      string    `json:"app_id" gorm:"not null"`
	UserID     string    `json:"user_id" gorm:"not null"`
	Alias      string    `json:"alias" gorm:"not null"`
	Attributes string    `json:"attributes" gorm:"not null"`
	Status     int32     `json:"status" gorm:"not null"`
	Uat        time.Time `json:"uat" gorm:"DEFAULT:current_timestamp"`
}
