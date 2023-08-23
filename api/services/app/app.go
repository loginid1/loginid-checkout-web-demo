package app

import "time"

const (
	kStatusActive        = 1
	ksStatusDisable      = 0
	ksStatusDisableByApp = 13
)

const (
	KEmailAttribute          = "email"
	KPhoneAttribute          = "phone"
	KDriversLicenseAttribute = "drivers-license"
	KAge18Attribute          = "age18"
	KBirthAttribute          = "birth"
)

const KAppUserConsentLimit = 20

type AppSession struct {
	ID         string      `json:"id"`
	AppID      string      `json:"app_id"`
	AppName    string      `json:"app_name"`
	Attributes string      `json:"attributes"`
	UserID     string      `json:"user_id"`
	Origin     string      `json:"origin"`
	IP         string      `json:"ip"`
	Method     string      `json:"method"`
	Token      string      `json:"token"`
	Oidc       *OidcExtras `json:"oidc"`
}

type OidcExtras struct {
	RedirectUri string `json:"redirect_uri"`
	Code        string `json:"code"`
	State       string `json:"state"`
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
	LoginAt    time.Time `json:"login_at" gorm:"DEFAULT:current_timestamp"`
}

type CustomConsent struct {
	UserID     string    `json:"user_id"`
	AppID      string    `json:"app_id"`
	Attributes string    `json:"attributes"`
	Origins    string    `json:"origins"`
	Status     int32     `json:"status"`
	Uat        time.Time `json:"uat"`
}

type CustomAppUser struct {
	ID         string    `json:"id"`
	Username   string    `json:"username"`
	Attributes string    `json:"attributes"`
	Status     int32     `json:"status"`
	Uat        time.Time `json:"uat"`
}

type CustomAppInfo struct {
	ID         string    `json:"id" `
	AppName    string    `json:"app_name" `
	Origins    string    `json:"origins"`
	Attributes string    `json:"attributes" `
	Status     int32     `json:"status" `
	UserCount  int64     `json:"user_count" `
	Iat        time.Time `json:"iat" `
	Uat        time.Time `json:"uat" `
}
