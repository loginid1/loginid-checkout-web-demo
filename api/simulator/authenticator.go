package simulator

import (
	"bytes"
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/binary"
	"encoding/json"
	"fmt"

	"github.com/fxamacker/cbor/v2"
	"github.com/loginid1/authn-service/util"
	"gitlab.com/loginid/software/services/loginid-vault/services/fido2"
)

type Authenticator struct {
	Username   string
	PublicKey  *ecdsa.PublicKey
	PrivateKey *ecdsa.PrivateKey
	KeyCounter uint32
	KeyHandle  string
}

type RegisterOption struct {
	AttestData string
	ClientData string
	KeyHandle  string
}

type LoginOption struct {
	AuthData   string
	ClientData string
	KeyHandle  string
	Signature  string
}

type ClientData struct {
	Challenge string `json:"challenge"`
	Type      string `json:"type"`
	Origin    string `json:"origin"`
}

func NewAuthenticator(username string) *Authenticator {
	// generate key pair
	key, _ := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
	return &Authenticator{Username: username, KeyHandle: util.GenerateRandomString(16), PrivateKey: key, PublicKey: &key.PublicKey, KeyCounter: 0}
}

func (a *Authenticator) Register(challenge string, rpid string, origin string) *RegisterOption {
	a.incrementCounter()
	client_data := buildClientData("webauthn.create", challenge, origin)
	auth_data := buildPackedAuthData("webauthn.create", rpid, a.KeyHandle, a.PublicKey, a.KeyCounter)

	attest_data, err := a.buildAttestData(auth_data, client_data)
	if err != nil {
		fmt.Println(err.Error())
		return nil
	}
	option := &RegisterOption{
		AttestData: base64.RawURLEncoding.EncodeToString(attest_data),
		ClientData: base64.RawURLEncoding.EncodeToString(client_data),
		KeyHandle:  base64.RawURLEncoding.EncodeToString([]byte(a.KeyHandle)),
	}
	return option
}

func (a *Authenticator) Login(challenge string, rpid string, origin string) *LoginOption {
	a.incrementCounter()
	client_data := buildClientData("webauthn.get", challenge, origin)
	auth_data := buildPackedAuthData("webauthn.get", rpid, a.KeyHandle, a.PublicKey, a.KeyCounter)

	sign_data, err := signData(auth_data, client_data, a.PrivateKey)
	if err != nil {
		fmt.Println(err.Error())
		return nil
	}
	option := &LoginOption{
		AuthData:   base64.RawURLEncoding.EncodeToString(auth_data),
		ClientData: base64.RawURLEncoding.EncodeToString(client_data),
		KeyHandle:  base64.RawURLEncoding.EncodeToString([]byte(a.KeyHandle)),
		Signature:  base64.RawURLEncoding.EncodeToString(sign_data),
	}
	return option
}

func (a *Authenticator) incrementCounter() {
	a.KeyCounter = a.KeyCounter + 1
}

func buildClientData(webauthn_type string, challenge string, origin string) []byte {
	data := ClientData{Type: webauthn_type, Challenge: challenge, Origin: origin}
	val, _ := json.Marshal(data)
	return val
}

func buildPackedAuthData(webauthn_type string, rpid string, key_handle string, public_key *ecdsa.PublicKey, counter uint32) []byte {
	var buffer bytes.Buffer

	rpidHash := sha256.Sum256([]byte(rpid))
	buffer.Write(rpidHash[:])
	//set flag
	if webauthn_type == "webauthn.create" {
		buffer.WriteByte(0x01 | 0x40 | 0x04)
	} else {
		buffer.WriteByte(0x01 | 0x04)
	}
	// add counter
	b := make([]byte, 4)
	binary.LittleEndian.PutUint32(b, counter)
	buffer.Write(b)
	// add attest data
	if webauthn_type == "webauthn.create" {
		//aaguid as 0000000000000000 (16 zero)
		//e.extend(vec![0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00, 0x00,0x00,0x00,0x00, 0x00,0x00,0x00,0x00]);
		buffer.Write(make([]byte, 16))

		// add credId
		// add credLength as u16
		cred_length := make([]byte, 2)
		binary.LittleEndian.PutUint16(cred_length, uint16(len(key_handle)))
		buffer.Write(cred_length)
		buffer.WriteString(key_handle)
		coseData := buildCosePublicKey(public_key)
		buffer.WriteString(string(coseData))

	}
	return buffer.Bytes()
}

func buildCosePublicKey(pk *ecdsa.PublicKey) []byte {
	cose := &fido2.CoseData{Kty: 2, Alg: -7, Crv: 1, X: pk.X.Bytes(), Y: pk.Y.Bytes()}
	val, _ := cbor.Marshal(cose)
	return val
}

func (a *Authenticator) buildAttestData(authData []byte, clientData []byte) ([]byte, error) {
	sign_data, err := signData(authData, clientData, a.PrivateKey)
	if err != nil {
		return nil, err
	}
	attestStatment := fido2.AttestStatement{Alg: int8(-7), Sig: sign_data}

	attestObject := &fido2.AttestObject{Fmt: "packed", AttStmt: attestStatment, AuthData: authData}
	return cbor.Marshal(attestObject)
}

func signData(authData []byte, clientData []byte, key *ecdsa.PrivateKey) ([]byte, error) {
	var buffer bytes.Buffer
	buffer.Write(authData)
	client_hash := sha256.Sum256(clientData)
	buffer.Write(client_hash[:])
	hash := sha256.Sum256(buffer.Bytes())
	val, err := ecdsa.SignASN1(rand.Reader, key, hash[:])
	if err != nil {
		return nil, err
	}
	return val, nil
}
