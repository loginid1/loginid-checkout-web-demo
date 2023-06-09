package services

import (
	"context"
	"fmt"
	"time"

	"gitlab.com/loginid/software/libraries/gocrypto.git/crypto/symmetric"
	"gitlab.com/loginid/software/libraries/goutil.git"
	lid_errors "gitlab.com/loginid/software/libraries/goutil.git/errors"
	"gitlab.com/loginid/software/libraries/goutil.git/pgxx"
)

var (
	keyCreateMaxRetry      = goutil.GetEnvInt("KEY_CREATE_MAX_RETRY", 3)
	keyCreateRetryCoolDown = goutil.GetEnvDuration("KEY_CREATE_RETRY_COOLDOWN", time.Millisecond*100)
	keyRotationDuration    = pgxx.NominalSeconds(goutil.GetEnvInt("KEY_ROTATION_DAYS", 30) * 24 * 3600)   // default 30 days
	keyGraceDuration       = pgxx.NominalSeconds(goutil.GetEnvInt("KEY_GRACE_DAYS", 60) * 24 * 3600)      // default 60 days
	keyRetentionDuration   = pgxx.NominalSeconds(goutil.GetEnvInt("KEY_RETENTION_DAYS", 365) * 24 * 3600) // default 365 days
	kmsKeyId               = goutil.GetEnv("KMS_KEY_ID", goutil.GetEnv("GOCRYPTO_AWS_KMS_KEY_ID", ""))
)

var symmetricService symmetric.ServiceInterface

func InitCrypto(connPool pgxx.PoolOrTx) {
	symmetricService = symmetric.Init(connPool)
}

func EncryptWithOwnerID(ctx context.Context, ownerID string, data string) (keyID string, encrypted []byte, err error) {
	// attempt to encrypt with the latest key
	for i := 0; i < keyCreateMaxRetry; i++ {
		keyID, encrypted, err = symmetricService.Encrypt(ctx, kmsKeyId, ownerID, data)

		if HasErrorCode(err, "key_not_found") { // key not found, wait a bit and try again
			time.Sleep(keyCreateRetryCoolDown)
		} else { // other error or success
			break
		}
	}

	// if key still not found, create a new key and try again
	if HasErrorCode(err, "key_not_found") {
		// create a new keystore for the owner - ignore error if keystore already exists
		CreateKeyStoreForOwnerID(ctx, ownerID, keyRotationDuration, keyGraceDuration, keyRetentionDuration)

		return symmetricService.Encrypt(ctx, kmsKeyId, ownerID, data)
	}

	// if key expired, create a new key and try again
	if HasErrorCode(err, "expired_key") {
		_, err = RotateKeyForOwnerID(ctx, ownerID)

		// if key creation failed, return the error
		if err != nil {
			return "", nil, err
		}
		return symmetricService.Encrypt(ctx, kmsKeyId, ownerID, data)
	}

	return keyID, encrypted, err
}

func DecryptWithOwnerID(ctx context.Context, ownerID, keyID string, encrypted []byte) (string, error) {
	if keyID == "" {
		return "", lid_errors.BadRequestWrap(fmt.Errorf("key_id is required"), false)
	}
	return symmetricService.Decrypt(ctx, kmsKeyId, ownerID, keyID, encrypted)
}

func CreateKeyStoreForOwnerID(ctx context.Context, ownerID string, rotation, grace, retention pgxx.NominalSeconds) (string, error) {
	return symmetricService.CreateKeystore(ctx, kmsKeyId, ownerID, rotation, grace, retention)
}

func RotateKeyForOwnerID(ctx context.Context, ownerID string) (string, error) {
	return symmetricService.RotateKey(ctx, kmsKeyId, ownerID)
}

// check for a specific code from the error returned by the crypto library
func HasErrorCode(err error, code string) bool {
	if err == nil {
		return false
	}
	oerr, ok := err.(lid_errors.OutputError)
	if !ok {
		return false
	}
	return oerr.ErrorCode() == code
}
