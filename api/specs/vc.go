package specs

// w3c verifiable credentials

// JWT
type W3cClaims struct {
	VC VerifiableCredential `json:"vc"`
}

var KW3cContext = []string{"https://www.w3.org/2018/credentials/v1", "https://www.w3.org/2018/credentials/examples/v1"}

type VerifiableCredential struct {
	Context           []string    `json:"@context"`
	ID                string      `json: "id"` // user related id
	Type              []string    `json:"type"`
	Issuer            string      `json: "issuer"`
	IssuanceDate      string      `json: "issuanceDate"`
	CredentialSubject interface{} `json:"credentialSubject`
	Iss               string      `json:"iss"` // issuer
	Nbf               string      `json:"nbf"` // not before time (current time)
	Jti               string      `json:"jti"` // nonce or unique
	Sub               string      `json:"sub"` // did:loginid:xxxxyyyy
}

type PhoneCredential struct {
	ID    string `json:"id"`   // pass id
	Type  string `json:"type"` // pass id
	Phone string `json:"phone"`
}

type EmailCredential struct {
	ID    string `json:"id"`   // pass id
	Type  string `json:"type"` // pass id
	Email string `json:"email"`
}

type DID struct {
	ID                 string              `json: "id"`
	VerificationMethod []VerficationMethod `json:"verificationMethod"`
	Authentication     []string            `json:"authentication"`
}

type VerficationMethod struct {
	ID           string       `json:"id"`
	Controller   string       `json:"controller"`
	Type         string       `json:"type"`
	PublicKeyJwk PublicKeyJwk `json:"publicKeyJwk"`
}

type PublicKeyJwk struct {
	Kty string `json:"kty"`
	Crv string `json:"crv"`
	X   string `json:"x"`
	Y   string `json:"y"`
}
