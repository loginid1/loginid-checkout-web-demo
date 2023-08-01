package fido2

import (
	"encoding/base64"
	"encoding/binary"
	"encoding/json"
	"fmt"

	"github.com/fxamacker/cbor/v2"
	logger "gitlab.com/loginid/software/libraries/goutil.git/logger"
	"gitlab.com/loginid/software/services/loginid-vault/services"
)

/*
CBOR decode
attestData = {fmt: string , attStmt , authData}

grab authData

grab COSE data

extract alg from COSE expecting(1:1,3:-7,-1:1,-2:X,-3:Y)
extrace key data X & Y from COSE
COSE TYPE (1) - create sign

COSE ALG (3)
ES256 | -7    | SHA-256 | ECDSA w/ SHA-256 |
              | ES384 | -35   | SHA-384 | ECDSA w/ SHA-384 |
              | ES512 | -36   | SHA-512 | ECDSA w/ SHA-512 |

			  -1 Curve Type P256
			  -2 X
			  -3 Y
*/

type AttestObject struct {
	Fmt      string          `cbor:"fmt"`
	AttStmt  AttestStatement `cbor:"attStmt",omitempty`
	AuthData []byte          `cbor:"authData`
}

type AttestStatement struct {
	Alg int8   `cbor:"alg,omitempty"`
	Sig []byte `cbor:"sig,omitempty"`
}

func ExtractPublicKey(attestation_data string) (string, string, *services.ServiceError) {

	var attestObject AttestObject
	data, err := base64.RawURLEncoding.DecodeString(attestation_data)
	if err != nil {
		logger.Global.Error(err.Error())
		return "", "", services.CreateError("invalid FIDO public key")
	}
	cbor.Unmarshal(data, &attestObject)

	coseBytes, err := parseCoseData(attestObject.AuthData)
	if err != nil {
		logger.Global.Error(err.Error())
		return "", "", services.CreateError("failed to parse public key")
	}

	var cose CoseData
	cbor.Unmarshal(coseBytes, &cose)
	if err != nil {
		logger.Global.Error(err.Error())
		return "", "", services.CreateError("invalid FIDO public key")
	}

	if cose.Kty != 2 && cose.Alg != -7 {
		logger.Global.Info(fmt.Sprintf("PK alg: %d", attestObject.AttStmt.Alg))
		return "", "", services.CreateError("unsupported public key")
	}

	//logger.Global.Info(fmt.Sprintf("%#v ", coseBytes))
	//logger.Global.Info(fmt.Sprintf("%#v %d", cose, attestObject.AttStmt.Alg))
	//public_key := "HNVQH74DGRLCQEQXNSLVYKTX5F5HXMS2M6IZJX4VFQRUUSNYEQ7MB5AV6E"
	logger.Global.Info(fmt.Sprintf("X: %s", base64.StdEncoding.EncodeToString(cose.X)))
	logger.Global.Info(fmt.Sprintf("Y: %s", base64.StdEncoding.EncodeToString(cose.Y)))
	jwk := convertToJWK(cose)
	public_key, err := json.Marshal(jwk)
	if err != nil {
		logger.Global.Error(err.Error())
		return "", "", services.CreateError("invalid FIDO public key")
	}
	return string(public_key), jwk.Crv, nil
}

// 32 bytes rpID
// 1 byte flag
// 4 bytes counter
// 16 bytes aaguid
// 2 bytes credlength
// X bytes credID (aka keyHandle)
// X bytes COSE data

type CoseData struct {
	Kty int    `cbor:"1,keyasint"`  // 1:2
	Alg int    `cbor:"3,keyasint"`  // 3:-7 for es256
	Crv int    `cbor:"-1,keyasint"` // -1:1 for es256
	X   []byte `cbor:"-2,keyasint"`
	Y   []byte `cbor:"-3,keyasint"`
}

const CRED_LENGTH_INDEX = 53

func parseCoseData(authData []byte) ([]byte, error) {

	credLen := authData[CRED_LENGTH_INDEX : CRED_LENGTH_INDEX+2]
	coseLength := binary.BigEndian.Uint16(credLen)
	coseIndex := CRED_LENGTH_INDEX + 2 + coseLength
	coseData := authData[coseIndex:]
	return coseData, nil
}

func convertToJWK(cose CoseData) services.EccJWK {

	crv := "P-256"
	if cose.Crv == 2 {
		crv = "P-384"
	} else if cose.Crv == 3 {
		crv = "P-521"
	}

	key := services.EccJWK{
		Crv: crv,
		X:   base64.RawURLEncoding.EncodeToString(cose.X),
		Y:   base64.RawURLEncoding.EncodeToString(cose.Y),
	}
	return key
}
