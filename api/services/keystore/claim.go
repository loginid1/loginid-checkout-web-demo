package keystore

const (
	KEmailClaimsRegister = "register"
	KEmailClaimsLogin    = "login"
)

/**
* use when sending email verification
 */
type EmailClaims struct {
	Email    string `json:"email,omitempty"`
	Type     string `json:"type"`
	IssuedAt int64  `json:"iat,omitempty"`
	Session  string `json:"session"`
}

type FidoClaims struct {
	Username string `json:"username,omitempty"`
	Type     string `json:"type"`
	Session  string `json:"session"`
	IssuedAt int64  `json:"iat,omitempty"`
}

type EmailLoginClaims struct {
	Client   string `json:"client"`
	Email    string `json:"email,omitempty"`
	Nonce    string `json:"nonce,omitempty"`
	Type     string `json:"type"`
	IssuedAt int64  `json:"iat,omitempty"`
}

type AuthSessionClaims struct {
	Nonce     string `json:"email,omitempty"`
	Client    string `json:"client"`
	UpdatedAt int64  `json:"uat,omitempty"`
}

/**
* return to federated apps after successful login
 */
type IDTokenClaims struct {
	Client string       `json:"client"`
	Nonce  string       `json:"nonce,omitempty"`
	Sub    string       `json:"sub"`
	Iat    int64        `json:"iat"`
	Passes []PassClaims `json:"passes,omitempty"`
}

type PassClaims struct {
	PassType string `json:"type"`
	Issuer   string `json:"issuer"`
}

type IDTokenPhonePass struct {
	PassClaims
	Phone string `json:"phone"`
}

/**
* token return for dashboard login
 */
type DashboardClaims struct {
	Sub    string `json:"sub"`
	FID    string `json:"fid"`
	UID    string `json:"uid"`
	Scopes string `json:"scopes"`
	Iat    int64  `json:"iat"`
}
