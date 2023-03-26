package keystore

const (
	KEmailClaimsRegister = "register"
	KEmailClaimsLogin    = "login"
)

type EmailClaims struct {
	Email    string `json:"email,omitempty"`
	Type     string `json:"type"`
	IssuedAt int64  `json:"iat,omitempty"`
	Session  string `json:"session"`
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
