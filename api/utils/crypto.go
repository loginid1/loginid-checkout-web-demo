package utils

import (
	"crypto/ecdsa"
	"crypto/x509"
	"encoding/pem"
	"errors"

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
