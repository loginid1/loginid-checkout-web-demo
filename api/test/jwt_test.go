package test

import (
	"testing"
	"time"

	logger "gitlab.com/loginid/software/libraries/goutil.git/logger"
	"gitlab.com/loginid/software/services/loginid-vault/db"
	"gitlab.com/loginid/software/services/loginid-vault/services/keystore"
	"gitlab.com/loginid/software/services/loginid-vault/utils"
)

func TestJWT(t *testing.T) {

	logger.InitLogging("vault-test")
	db.CreateConnection()
	keystoreService, err := keystore.NewKeystoreService(db.GetConnection())
	if err != nil {
		t.Fatalf("error: %s", err.Error())
	}
	keystoreService.InitKeystore()
	nonce, _ := utils.GenerateRandomString(16)
	claims := keystore.IDTokenClaims{
		Client: "b6c2b5e6-dc10-4292-a098-f156a4726fe6",
		Nonce:  nonce,
		Sub:    "peter@loginid.io",
		Iat:    time.Now().UnixMilli(),
	}
	jwt, _ := keystoreService.GenerateIDTokenJWT(claims)
	println(jwt)
}
