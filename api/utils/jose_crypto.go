package utils

import (
	"crypto"
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/rand"
	"encoding/base64"
	"fmt"

	"github.com/go-jose/go-jose/v3"
)

func GenerateRawJWKKeystore() (*jose.JSONWebKey, error) {

	key, err := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
	if err != nil {
		return nil, err
	}

	jwk := jose.JSONWebKey{Key: key, Use: "sig"}

	return &jwk, nil
}

func GetPublicKeyJWK(jwk_keystore []byte) (*jose.JSONWebKey, error) {
	key := jose.JSONWebKey{}
	err := key.UnmarshalJSON(jwk_keystore)
	if err != nil {
		return nil, err
	}

	public := key.Public()
	return &public, nil
}

func JWKSign(jwk_keystore []byte, msg string) (string, error) {
	key := jose.JSONWebKey{}
	err := key.UnmarshalJSON(jwk_keystore)
	if err != nil {
		return "", err
	}

	hasher := crypto.Hash.New(crypto.SHA256)
	hasher.Write([]byte(msg))

	r, s, err := ecdsa.Sign(rand.Reader, key.Key.(*ecdsa.PrivateKey), hasher.Sum(nil))
	if err != nil {
		return "", err
	}
	fmt.Printf("signature length: %d %d", len(r.Bytes()), len(s.Bytes()))

	signature := append(r.Bytes(), s.Bytes()...)

	return base64.StdEncoding.EncodeToString(signature), nil
}
