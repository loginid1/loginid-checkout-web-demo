package fido2

import (
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
func ExtractPublicKey(attestation_data string) (string, string, *services.ServiceError) {
	public_key := "HNVQH74DGRLCQEQXNSLVYKTX5F5HXMS2M6IZJX4VFQRUUSNYEQ7MB5AV6E"
	return public_key, "ES256", nil
}
