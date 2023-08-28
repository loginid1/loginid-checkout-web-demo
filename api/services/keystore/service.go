package keystore

import (
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/rand"
	"crypto/x509"
	"encoding/base64"
	"encoding/json"
	"encoding/pem"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/allegro/bigcache"
	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/kms"
	goutil "gitlab.com/loginid/software/libraries/goutil.git"
	"gitlab.com/loginid/software/libraries/goutil.git/logger"
	"gitlab.com/loginid/software/services/loginid-vault/services"
	"gitlab.com/loginid/software/services/loginid-vault/specs"
	"gitlab.com/loginid/software/services/loginid-vault/utils"
	"gorm.io/gorm"
)

//var KEYSTORE_TYPE = goutil.GetEnv("KEYSTORE_TYPE", "awskms")
var AWS_KMS_REGION = goutil.GetEnv("AWS_KMS_REGION", "us-west-2")
var AWS_KMS_KEY_ID = goutil.GetEnv("AWS_KMS_KEY_ID", "")

// KeystoreService object
type KeystoreService struct {
	ksRepo  *KeystoreRepository
	ksCache *bigcache.BigCache
}

// NewKeystoreService construct new keystore service
// throw error instead of os.Exit()
func NewKeystoreService(db *gorm.DB) (*KeystoreService, error) {
	keystoreRepo := NewKeystoreRepository(db)
	keystoreCache, err := bigcache.NewBigCache(bigcache.DefaultConfig(10 * time.Minute))
	if err != nil {
		return nil, errors.New("fail to initialize big cache")
	}
	return &KeystoreService{
		ksRepo:  keystoreRepo,
		ksCache: keystoreCache,
	}, nil
}

// init signing & session keystore
func (s *KeystoreService) InitKeystore() error {
	ksType := goutil.GetEnv("KEYSTORE_TYPE", "local")
	err := s.InitKeystoreScope(ksScopeSign, ksSignID, ksType)
	if err != nil {
		return err
	}
	err = s.InitKeystoreScope(ksScopeSession, ksSessionID, ksType)
	return err
}

func (s *KeystoreService) InitKeystoreScope(scopeType int32, scopeID string, ksType string) error {

	dbks, err := s.ksRepo.GetKeystoreByScope(scopeType, ksStatusActive, ksType)
	if err != nil {

		if errors.Is(err, gorm.ErrRecordNotFound) {
			// create new keystore
			dbks, err = generateKeystore(s.ksRepo, ksType, scopeType)
			if err != nil {
				logger.Global.Error("failed to create keystore ")
				return err
			}

		} else {
			logger.Global.Error("failed to load keystore ")
			return err
		}
	}

	if strings.HasPrefix(dbks.KeystoreType, "aws_") {
		// decrypt keystore
		decryptPrivateKey, err := awsDecryption(dbks.PrivateKey)
		if err != nil {
			logger.Global.Error(fmt.Sprintf("failed to decrypt keystore: %s", err.Error()))
			return err
		}
		dbks.PrivateKey = decryptPrivateKey
	}

	// store keystore to cache
	value, err := json.Marshal(dbks)
	if err != nil {
		logger.Global.Error("failed to marshal keystore")
		return err
	}
	err = s.ksCache.Set(scopeID, value)
	if err != nil {
		logger.Global.Error("failed to store to keystore cache")
		return err
	}

	err = s.ksCache.Set(dbks.ID, value)
	if err != nil {
		logger.Global.Error("failed to store to keystore cache")
		return err
	}
	return nil

}

// LoadKeystore
func (s *KeystoreService) LoadKeystore(kid string) *Keystore {
	// get keystore from keystoreMap cache
	ksByte, _ := s.ksCache.Get(kid)
	var ks Keystore
	if len(ksByte) > 0 {
		err := json.Unmarshal(ksByte, &ks)
		if err == nil {
			//logger.Global.Debug(fmt.Sprintf("find key from cache %s", kid))
			return &ks
		}
	}

	//logger.Global.Debug(fmt.Sprintf("load key from db %s", kid))
	dbks, err := s.ksRepo.GetKeystoreByID(kid)
	if err != nil {
		logger.Global.Error("failed to load keystore " + kid)
		return nil
	}

	if strings.HasPrefix(dbks.KeystoreType, "aws_") {
		// decrypt keystore
		decryptPrivateKey, err := awsDecryption(dbks.PrivateKey)
		if err != nil {
			logger.Global.Error(fmt.Sprintf("failed to decrypt keystore: %s", err.Error()))
			return nil
		}
		dbks.PrivateKey = decryptPrivateKey
	}

	// make sure key isn't expired
	if dbks.Status > 0 {
		logger.Global.Error(fmt.Sprintf("key expired %s", dbks.ID))
		return nil
	}
	// store keystore to cache
	value, err := json.Marshal(dbks)
	if err != nil {
		logger.Global.Error("failed to marshal keystore")
		return dbks
	}
	err = s.ksCache.Set(kid, value)
	if err != nil {
		logger.Global.Error("failed to store to keystore cache")
	}
	return dbks
}

func (s *KeystoreService) GenerateEmailValidationJWT(email string, request_type string, session string) (string, *services.ServiceError) {

	keystore := s.LoadKeystore(ksSessionID)
	if keystore == nil {
		return "", services.CreateError("fail to load key")
	}

	privateKey, err := utils.ParseECPrivateKeyFromPEM([]byte(keystore.PrivateKey))
	if err != nil {
		return "", services.CreateError("fail to load key in pem format")
	}

	claims := &EmailClaims{Email: email, Type: request_type, Session: session, IssuedAt: time.Now().Unix()}
	token, err := utils.GenerateJWT(privateKey, keystore.ID, claims)
	if err != nil {
		return "", services.CreateError("fail to generate token")
	}
	return token, nil
}

func (s *KeystoreService) GenerateIDTokenJWT(claims IDTokenClaims) (string, *services.ServiceError) {

	keystore := s.LoadKeystore(ksSignID)
	if keystore == nil {
		return "", services.CreateError("fail to load key")
	}

	privateKey, err := utils.ParseECPrivateKeyFromPEM([]byte(keystore.PrivateKey))
	if err != nil {
		return "", services.CreateError("fail to load key in pem format")
	}

	token, err := utils.GenerateJWT(privateKey, keystore.ID, claims)
	if err != nil {
		return "", services.CreateError("fail to generate token")
	}
	return token, nil
}

func (s *KeystoreService) GenerateDashboardJWT(username string, userid string, fid string, scopes string) (string, *services.ServiceError) {

	keystore := s.LoadKeystore(ksSessionID)
	if keystore == nil {
		return "", services.CreateError("fail to load key")
	}

	privateKey, err := utils.ParseECPrivateKeyFromPEM([]byte(keystore.PrivateKey))
	if err != nil {
		return "", services.CreateError("fail to load key in pem format")
	}

	claims := DashboardClaims{Sub: username, FID: fid, Scopes: scopes, UID: userid, Iat: time.Now().Unix()}

	token, err := utils.GenerateJWT(privateKey, keystore.ID, claims)
	if err != nil {
		return "", services.CreateError("fail to generate token")
	}
	return token, nil
}

func (s *KeystoreService) GenerateVCJWT(claim specs.W3cClaims) (string, *services.ServiceError) {

	keystore := s.LoadKeystore(ksSignID)
	if keystore == nil {
		return "", services.CreateError("fail to load key")
	}

	privateKey, err := utils.ParseECPrivateKeyFromPEM([]byte(keystore.PrivateKey))
	if err != nil {
		return "", services.CreateError("fail to load key in pem format")
	}

	token, err := utils.GenerateJWT(privateKey, keystore.ID, claim)
	if err != nil {
		return "", services.CreateError("fail to generate token")
	}
	return token, nil
}

func (s *KeystoreService) VerifyEmailJWT(token string) (*EmailClaims, *services.ServiceError) {
	keystore := s.LoadKeystore(ksSessionID)
	if keystore == nil {
		return nil, services.CreateError("fail to load key")
	}

	publicKey, err := utils.LoadPublicKeyFromPEM(keystore.PublicKey)
	if err != nil {
		return nil, services.CreateError("fail to load key in pem format")
	}
	var claims EmailClaims
	err = utils.VerifyClaims(token, publicKey, &claims)
	if err != nil {
		return nil, services.CreateError("fail to load key in pem format")
	}
	return &claims, nil
}

func (s *KeystoreService) VerifyDashboardJWT(token string) (*DashboardClaims, *services.ServiceError) {
	keystore := s.LoadKeystore(ksSessionID)
	if keystore == nil {
		return nil, services.CreateError("fail to load key")
	}

	publicKey, err := utils.LoadPublicKeyFromPEM(keystore.PublicKey)
	if err != nil {
		return nil, services.CreateError("fail to load key in pem format")
	}
	var claims DashboardClaims
	err = utils.VerifyClaims(token, publicKey, &claims)
	if err != nil {
		return nil, services.CreateError("fail to load key in pem format")
	}
	return &claims, nil
}

func (s *KeystoreService) VerifyIDJWT(token string) (*IDTokenClaims, *services.ServiceError) {
	keystore := s.LoadKeystore(ksSignID)
	if keystore == nil {
		return nil, services.CreateError("fail to load key")
	}

	publicKey, err := utils.LoadPublicKeyFromPEM(keystore.PublicKey)
	if err != nil {
		return nil, services.CreateError("fail to load key in pem format")
	}
	var claims IDTokenClaims
	err = utils.VerifyClaims(token, publicKey, &claims)
	if err != nil {
		return nil, services.CreateError("fail to verify claims")
	}
	return &claims, nil
}

func (s *KeystoreService) VerifyFidoJWT(token string) (*FidoClaims, *services.ServiceError) {
	keystore := s.LoadKeystore(ksSessionID)
	if keystore == nil {
		return nil, services.CreateError("fail to load key")
	}

	publicKey, err := utils.LoadPublicKeyFromPEM(keystore.PublicKey)
	if err != nil {
		return nil, services.CreateError("fail to load key in pem format")
	}
	var claims FidoClaims
	err = utils.VerifyClaims(token, publicKey, &claims)
	if err != nil {
		return nil, services.CreateError("fail to load key in pem format")
	}
	return &claims, nil
}

func (s *KeystoreService) GetJWKS() (*Jwks, *services.ServiceError) {
	keystore := s.LoadKeystore(ksSignID)
	if keystore == nil {
		return nil, services.CreateError("fail to load key")
	}
	if keystore.Alg != "ES256" {
		return nil, services.CreateError("invalid key")
	}

	public, err := utils.LoadPublicKeyFromPEM(keystore.PublicKey)
	if err != nil {
		return nil, services.CreateError("invalid key")
	}

	key := EccJwk{
		Kid: keystore.ID,
		Kty: "EC",
		Crv: "P-256",
		X:   base64.RawURLEncoding.EncodeToString(public.X.Bytes()),
		Y:   base64.RawURLEncoding.EncodeToString(public.Y.Bytes()),
	}
	var keys []EccJwk
	keys = append(keys, key)

	return &Jwks{Keys: keys}, nil

}

func awsEncryption(data string) (string, error) {
	sess, err := session.NewSession(&aws.Config{
		Region:                        aws.String(AWS_KMS_REGION),
		CredentialsChainVerboseErrors: aws.Bool(true),
	},
	)
	if err != nil {
		logger.Global.Error(fmt.Sprintf("error initialize aws session %s", err.Error()))
		return "", err
	}

	// Create KMS service client
	svc := kms.New(sess)

	// Encrypt the data
	result, err := svc.Encrypt(&kms.EncryptInput{
		KeyId:     aws.String(AWS_KMS_KEY_ID),
		Plaintext: []byte(data),
	})

	if err != nil {
		logger.Global.Error(fmt.Sprintf("Error while encrypting data: %s", err.Error()))
		return "", err
	}

	encDataString := base64.RawURLEncoding.EncodeToString(result.CiphertextBlob)
	return encDataString, nil

}

func awsDecryption(data string) (string, error) {
	sess, err := session.NewSession(&aws.Config{
		Region:                        aws.String(AWS_KMS_REGION),
		CredentialsChainVerboseErrors: aws.Bool(true),
	},
	)
	if err != nil {
		logger.Global.Error(fmt.Sprintf("error initialize aws session: %s", err.Error()))
		return "", err
	}
	// Create KMS service client
	svc := kms.New(sess)

	// decode data from base64url
	decodeData, err := base64.RawURLEncoding.DecodeString(data)
	if err != nil {
		logger.Global.Error(fmt.Sprintf("decoding key to base64url error: %s", err.Error()))
	}
	// Decrypt the data
	result, err := svc.Decrypt(&kms.DecryptInput{
		KeyId:          aws.String(AWS_KMS_KEY_ID),
		CiphertextBlob: decodeData,
	})

	if err != nil {
		logger.Global.Error(fmt.Sprintf("error while decrypting data: %s", err.Error()))
		return "", err
	}

	if err != nil {
		return "", err
	}
	return string(result.Plaintext), nil

}

func generateKey() *ecdsa.PrivateKey {
	key, err := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
	if err != nil {
		logger.Global.Error(fmt.Sprintf("failed to generate key: %s", err.Error()))
		return nil
	}
	return key
}

func generateKeystore(repo *KeystoreRepository, ksType string, scope int32) (*Keystore, error) {
	// generate keyID
	//keyID := uuid.New().String()

	var ks *Keystore
	if strings.HasPrefix(ksType, "aws_") {
		ks = kmsGenerateKey(ksType, scope, repo)
		if ks == nil {
			return nil, errors.New("failed to create kms keystore")
		}
	} else {
		ks = localGenerateKey(ksType, scope, repo)
		if ks == nil {
			return nil, errors.New("failed to create local keystore")
		}
	}
	return ks, nil
}

func localGenerateKey(ksType string, scope int32, repo *KeystoreRepository) *Keystore {
	key := generateKey()
	if key == nil {
		return nil
	}

	encPriv, encPub, err := encode(key, &key.PublicKey)
	if err != nil {
		return nil
	}

	keystore := &Keystore{
		Alg:          "ES256",
		KeystoreType: ksType,
		PrivateKey:   encPriv,
		PublicKey:    encPub,
		Scope:        scope,
		Status:       ksStatusActive,
	}
	err = repo.CreateKeystore(keystore)
	if err == nil {
		return keystore
	} else {
		return nil
	}
}

func kmsGenerateKey(ksType string, scope int32, repo *KeystoreRepository) *Keystore {
	key := generateKey()
	if key == nil {
		return nil
	}
	// encode key to pem format
	encPriv, encPub, err := encode(key, &key.PublicKey)
	if err != nil {
		return nil
	}

	// encrypt privateKey with AWS
	cryptoPriv, err := awsEncryption(encPriv)
	if err != nil {

		return nil
	}

	keystore := &Keystore{
		Alg:          "ES256",
		KeystoreType: ksType,
		PrivateKey:   cryptoPriv,
		PublicKey:    encPub,
		Scope:        scope,
		Status:       ksStatusActive,
	}
	err = repo.CreateKeystore(keystore)

	if err == nil {
		return keystore
	} else {
		return nil
	}
}

func encode(privateKey *ecdsa.PrivateKey, publicKey *ecdsa.PublicKey) (string, string, error) {
	x509Encoded, err := x509.MarshalECPrivateKey(privateKey)
	if err != nil {
		return "", "", err
	}
	pemEncoded := pem.EncodeToMemory(&pem.Block{Type: "EC PRIVATE KEY", Bytes: x509Encoded})

	x509EncodedPub, err := x509.MarshalPKIXPublicKey(publicKey)
	if err != nil {
		return "", "", err
	}
	pemEncodedPub := pem.EncodeToMemory(&pem.Block{Type: "PUBLIC KEY", Bytes: x509EncodedPub})

	return string(pemEncoded), string(pemEncodedPub), nil
}
