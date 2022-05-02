package utils

import (
	"crypto/ecdsa"
	"crypto/sha256"
	"crypto/x509"
	"encoding/asn1"
	"encoding/base64"
	"encoding/pem"
	"errors"
	"math/big"
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

func ParseClaims(token string, out interface{}) error {

	tok, err := jwt.ParseSigned(token)
	if err != nil {
		return err
	}

	if err := tok.UnsafeClaimsWithoutVerification(&out); err != nil {
		return err
	}
	return nil
}

type ApiClaims struct {
	Type        string `json:"type,omitempty"`
	Nonce       string `json:"nonce,omitempty"`
	Username    string `json:"username,omitempty"`
	Sub         string `json:"sub,omitempty"`
	IssuedAt    int64  `json:"iat,omitempty"`
	PayloadHash string `json:"payload_hash,omitempty"`
}

func GenerateLoginApiTokenByUsername(key *ecdsa.PrivateKey, tokenType string, username string, payload string) (string, error) {
	nonce := uuid.New().String()
	claim := ApiClaims{
		Type:     tokenType,
		Nonce:    nonce,
		Username: username,
		IssuedAt: time.Now().Unix(),
	}
	if payload != "" {
		h := sha256.Sum256([]byte(payload))
		hash := base64.RawURLEncoding.EncodeToString(h[:])
		claim.PayloadHash = hash
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

type ECDSASig struct {
	R, S *big.Int
}

/**
* signature base64Url encode
 */
func ConvertSignatureBase64RS(signature string) (string, string, error) {

	decode, err := base64.RawURLEncoding.DecodeString(signature)
	if err != nil {
		return "", "", err
	}
	var sig ECDSASig
	_, err = asn1.Unmarshal(decode, &sig)
	if err != nil {
		return "", "", err
	}

	return base64.StdEncoding.EncodeToString(sig.R.Bytes()), base64.StdEncoding.EncodeToString(sig.S.Bytes()), nil
}

/**
* signature base64Url encode
 */
func ConvertSignatureRS(signature string) ([]byte, []byte, error) {

	decode, err := base64.RawURLEncoding.DecodeString(signature)
	if err != nil {
		return nil, nil, err
	}
	var sig ECDSASig
	_, err = asn1.Unmarshal(decode, &sig)
	if err != nil {
		return nil, nil, err
	}

	return sig.R.Bytes(), sig.S.Bytes(), nil
}
