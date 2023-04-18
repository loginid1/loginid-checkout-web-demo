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

type IDTokenClains struct {
	Client string       `json:"client"`
	Nonce  string       `json:"email,omitempty"`
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
