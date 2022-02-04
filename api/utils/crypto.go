package utils

import (
	"crypto/ecdsa"
	"crypto/x509"
	"encoding/pem"
	"errors"
	"time"

	"github.com/google/uuid"
	"gopkg.in/square/go-jose.v2"
	"gopkg.in/square/go-jose.v2/jwt"
)

func LoadPublicKeyFromPEM(publicKey string) (*ecdsa.PublicKey, error) {
	// decode the key, assuming it's in PEM format
	block, _ := pem.Decode([]byte(publicKey))
	if block == nil {
		return nil, errors.New("failed to decode pem public key")
	}
	pub, err := x509.ParsePKIXPublicKey(block.Bytes)
	if err != nil {
		return nil, errors.New("failed to parse ecdsa public key")
	}
	switch pub := pub.(type) {
	case *ecdsa.PublicKey:
		return pub, nil
	}
	return nil, errors.New("unsupported public key type")
}

func LoadPrivateKeyFromPEM(key []byte) (*ecdsa.PrivateKey, error) {
	block, _ := pem.Decode(key)
	if block == nil {
		return nil, errors.New("failed to decode pem private key")
	}

	priv, err := x509.ParsePKCS8PrivateKey(block.Bytes)
	if err != nil {
		return nil, err
	}
	switch priv := priv.(type) {
	case *ecdsa.PrivateKey:
		return priv, nil
	}
	return nil, errors.New("unsupported private key type")
}

func GetKIDFromToken(token string) (string, error) {

	tok, err := jwt.ParseSigned(token)
	if err != nil {
		return "", err
	}

	if len(tok.Headers) > 0 {
		return tok.Headers[0].KeyID, nil
	}
	return "", errors.New("no key header")

}

func VerifyClaims(token string, key *ecdsa.PublicKey, out interface{}) error {

	tok, err := jwt.ParseSigned(token)
	if err != nil {
		return err
	}

	//out := make(map[string]interface{})
	if err := tok.Claims(key, &out); err != nil {
		return err
	}
	return nil

}

type ApiClaims struct {
	Type     string `json:"type,omitempty"`
	Nonce    string `json:"nonce,omitempty"`
	Username string `json:"username,omitempty"`
	Sub      string `json:"sub,omitempty"`
	IssuedAt int64  `json:"iat,omitempty"`
}

func GenerateLoginApiTokenByUsername(key *ecdsa.PrivateKey, tokenType string, username string, payload string) (string, error) {
	nonce := uuid.New().String()
	claim := ApiClaims{
		Type:     tokenType,
		Nonce:    nonce,
		Username: username,
		IssuedAt: time.Now().Unix(),
	}

	sig, err := jose.NewSigner(jose.SigningKey{Algorithm: jose.ES256, Key: key}, (&jose.SignerOptions{}).WithType("JWT"))
	if err != nil {
		return "", errors.New("failed to generate JWT")
	}

	raw, err := jwt.Signed(sig).Claims(claim).CompactSerialize()
	if err != nil {
		return "", errors.New("failed to generate JWT")
	}
	return raw, nil

}

func GenerateLoginApiTokenByUserID(key *ecdsa.PrivateKey, tokenType string, userID string, payload string) (string, error) {
	nonce := uuid.New().String()
	claim := ApiClaims{
		Type:     tokenType,
		Nonce:    nonce,
		Sub:      userID,
		IssuedAt: time.Now().Unix(),
	}

	sig, err := jose.NewSigner(jose.SigningKey{Algorithm: jose.ES256, Key: key}, (&jose.SignerOptions{}).WithType("JWT"))
	if err != nil {
		return "", errors.New("failed to generate JWT")
	}

	raw, err := jwt.Signed(sig).Claims(claim).CompactSerialize()
	if err != nil {
		return "", errors.New("failed to generate JWT")
	}
	return raw, nil

}
