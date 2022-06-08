package algo

import (
	"context"
	"encoding/base32"
	"encoding/base64"
	"fmt"
	"strings"

	"github.com/algorand/go-algorand-sdk/client/v2/common/models"
	"github.com/algorand/go-algorand-sdk/crypto"
	algo_crypto "github.com/algorand/go-algorand-sdk/crypto"
	"github.com/algorand/go-algorand-sdk/encoding/msgpack"
	"github.com/algorand/go-algorand-sdk/transaction"
	"github.com/algorand/go-algorand-sdk/types"
	"gitlab.com/loginid/software/libraries/goutil.git/logger"
	"gitlab.com/loginid/software/services/loginid-vault/services"
	"gitlab.com/loginid/software/services/loginid-vault/services/user"
	"gitlab.com/loginid/software/services/loginid-vault/utils"
	"gorm.io/gorm"
)

type AlgoService struct {
	UserRepository *user.UserRepository
	AlgoRepository *AlgoRepository
	AlgoNet        *AlgorandNetworkService
	Indexer        *AlgorandIndexerService
}

// NewUserService
// initialize UserService struct
func NewAlgoService(db *gorm.DB) (*AlgoService, error) {

	algoNet, err := NewAlgorandNeworkService()
	if err != nil {
		return nil, err
	}
	indexer, err := NewAlgorandIndexerService()
	if err != nil {
		return nil, err
	}
	algoService := AlgoService{
		UserRepository: &user.UserRepository{DB: db},
		AlgoRepository: &AlgoRepository{DB: db},
		AlgoNet:        algoNet,
		Indexer:        indexer,
	}
	return &algoService, nil
}

func (algo *AlgoService) CreateAccount(username string, alias string, verify_address string, credential_id_list []string, recovery string) *services.ServiceError {
	// get script from credential_list and recovery

	credentials, err := algo.UserRepository.LookupCredentials(username, credential_id_list)
	if err != nil {
		logger.Global.Error(err.Error())
		return services.CreateError("failed to validate credentials list")
	}

	credential_list := extractCredentialPKs(credentials)

	contractAccount, err := algo.AlgoNet.GenerateContractAccount(credential_list, recovery, true)
	if err != nil {
		logger.Global.Error(err.Error())
		return services.CreateError("failed to generate Algorand account")
	}

	// make sure contractAccount == verify_address
	// this case shouldn't happened unless the inputs is tamper or change
	if contractAccount.Address != verify_address {
		return services.CreateError("account creation fail - address mismatch")
	}

	_, err = algo.AlgoRepository.LookupAddress(verify_address)
	if err == nil {
		return services.CreateError("address already existed! ")
	}

	if alias == "" {
		alias = contractAccount.Address
	}
	// create AlgoAccount
	account := AlgoAccount{
		Alias:           alias,
		Address:         contractAccount.Address,
		TealVersion:     CURRENT_TEAL_VERSION,
		TealScript:      contractAccount.TealScript,
		CompileScript:   contractAccount.CompileScript,
		CredentialsID:   convertStringArrayToText(credential_id_list),
		CredentialsPK:   convertStringArrayToText(credential_list),
		RecoveryAddress: recovery,
		AccountStatus:   "new",
	}

	err = algo.AlgoRepository.AddAlgoAccount(username, &account)
	if err != nil {
		logger.Global.Error(err.Error())
		return services.CreateError("create Algorand account error")
	}
	return nil
}

func (algo *AlgoService) RekeyAccountInit(username string, rekey_address string, credential_id_list []string, recovery string) (*ChangeAccount, *types.Transaction, *services.ServiceError) {
	// get script from credential_list and recovery

	credentials, err := algo.UserRepository.LookupCredentials(username, credential_id_list)
	if err != nil {
		logger.Global.Error(err.Error())
		return nil, nil, services.CreateError("failed to validate credentials list")
	}

	credential_list := extractCredentialPKs(credentials)

	contractAccount, err := algo.AlgoNet.GenerateContractAccount(credential_list, recovery, false)
	if err != nil {
		logger.Global.Error(err.Error())
		return nil, nil, services.CreateError("failed to generate Algorand account")
	}

	// make sure the key not existed??? may allows same key multiple account
	auth_account, err := algo.AlgoRepository.LookupAddress(contractAccount.Address)
	/*
		if err == nil {
			return nil, nil, services.CreateError("address already existed! ")
		}*/

	// lookup main account
	rekey_account, err := algo.AlgoRepository.LookupAddress(rekey_address)
	if err != nil {
		return nil, nil, services.CreateError("account not found!")
	}

	if rekey_account.AuthAddress != nil {
		if auth_account != nil && auth_account.Address == *rekey_account.AuthAddress {
			return nil, nil, services.CreateError("no key change")
		}
	} else {
		if auth_account != nil && auth_account.Address == rekey_account.Address {
			return nil, nil, services.CreateError("no key change")
		}
	}

	// create AlgoAccount
	if auth_account == nil {

		account := AlgoAccount{
			Alias:           contractAccount.Address,
			Address:         contractAccount.Address,
			TealVersion:     CURRENT_TEAL_VERSION,
			TealScript:      contractAccount.TealScript,
			CompileScript:   contractAccount.CompileScript,
			CredentialsID:   convertStringArrayToText(credential_id_list),
			CredentialsPK:   convertStringArrayToText(credential_list),
			RecoveryAddress: recovery,
			AccountStatus:   "rekey",
		}

		err = algo.AlgoRepository.AddAlgoAccount(username, &account)
		if err != nil {
			logger.Global.Error(err.Error())
			return nil, nil, services.CreateError("create Algorand account error")
		}
		auth_account = &account
	}
	// rekey diff

	diffAccount := algo.compareAccount(username, *rekey_account, *auth_account)
	fmt.Println("here")
	// need to create rekey transaction
	params, err := algo.AlgoNet.client.SuggestedParams().Do(context.Background())
	if err != nil {
		logger.Global.Error(fmt.Sprintf("error suggested param: %s", err.Error()))
		return nil, nil, services.CreateError("rekey error - node not available")
	}
	txn, err := transaction.MakePaymentTxnWithFlatFee(rekey_address, rekey_address, 1000, 0, uint64(params.FirstRoundValid), uint64(params.LastRoundValid), []byte(""), "", params.GenesisID, params.GenesisHash)
	if err != nil {
		logger.Global.Error(fmt.Sprintf("error rekey transaction: %s", err.Error()))
		return nil, nil, services.CreateError("rekey error - fail to create transaction")
	}

	txn.Rekey(auth_account.Address)
	fmt.Println("complete")

	return diffAccount, &txn, nil
}

func (s *AlgoService) RekeyAccountComplete(username string, address string, auth_address string) *services.ServiceError {
	err := s.AlgoRepository.RekeyAccount(username, address, auth_address)
	if err != nil {
		return services.CreateError("fail to commit account to DB")
	}
	return nil
}

func (algo *AlgoService) GetAccount(username string, address string, includeBalance bool) (*AlgoAccount, *services.ServiceError) {

	account, err := algo.AlgoRepository.GetAccountFull(username, address)
	if err != nil {
		logger.Global.Error(err.Error())
		return nil, services.CreateError("failed to retrieve accounts - try again")
	}

	credentialList, err := algo.UserRepository.LookupCredentials(username, strings.Split(account.CredentialsID, ","))
	if err != nil {
		logger.Global.Error(err.Error())
		return nil, services.CreateError("failed to retrieve accounts - try again")
	}
	account.Credentials = credentialList
	// load authaccount credential
	if account.AuthAccount != nil {

		credentialList, err := algo.UserRepository.LookupCredentials(username, strings.Split(account.AuthAccount.CredentialsID, ","))
		if err != nil {
			logger.Global.Error(err.Error())
			return nil, services.CreateError("failed to retrieve accounts - try again")
		}
		account.AuthAccount.Credentials = credentialList
	}
	if includeBalance {
		balance, err := algo.Indexer.GetAccountsByID(account.Address)
		if err != nil {
			logger.Global.Error(err.Error())
		} else {
			account.Balance = &AccountBalance{
				Amount:       balance.Amount,
				CurrentRound: balance.Round,
				Status:       balance.Status,
			}
		}
	}

	return account, nil
}

func (algo *AlgoService) GetAccountList(username string, includeBalance bool) ([]AlgoAccount, *services.ServiceError) {

	accountList, err := algo.AlgoRepository.GetAccountList(username)
	if err != nil {
		logger.Global.Error(err.Error())
		return accountList, services.CreateError("failed to retrieve accounts - try again")
	}

	for i, account := range accountList {
		credentialList, err := algo.UserRepository.LookupCredentials(username, strings.Split(account.CredentialsID, ","))
		if err != nil {
			logger.Global.Error(err.Error())
			return accountList, services.CreateError("failed to retrieve accounts - try again")
		}
		accountList[i].Credentials = credentialList
		// load authaccount credential
		if account.AuthAccount != nil {

			credentialList, err := algo.UserRepository.LookupCredentials(username, strings.Split(account.AuthAccount.CredentialsID, ","))
			if err != nil {
				logger.Global.Error(err.Error())
				return accountList, services.CreateError("failed to retrieve accounts - try again")
			}
			account.AuthAccount.Credentials = credentialList
		}
		if includeBalance {
			balance, err := algo.Indexer.GetAccountsByID(account.Address)
			if err != nil {
				logger.Global.Error(err.Error())
			} else {
				accountList[i].Balance = &AccountBalance{
					Amount:       balance.Amount,
					CurrentRound: balance.Round,
					Status:       balance.Status,
				}
			}
		}
	}
	return accountList, nil
}

func (algo *AlgoService) RenameAccount(id string, name string) *services.ServiceError {
	if err := algo.AlgoRepository.RenameAccount(id, name); err != nil {
		logger.Global.Error(err.Error())
		return services.CreateError("failed to rename account alias - try again")
	}
	return nil

}

func (algo *AlgoService) GenerateFido2Signature(credentialList []string, recovery string) (*ContractAccount, *services.ServiceError) {
	account, err := algo.AlgoNet.GenerateContractAccount(credentialList, recovery, true)
	if err != nil {
		logger.Global.Error(err.Error())
		return nil, services.CreateError("generate script error")
	}
	return account, nil

}

func (algo *AlgoService) QuickAccountCreation(username string, recovery_pk string) (*AlgoAccount, *services.ServiceError) {
	// get script from credential_list and recovery

	credentials, err := algo.UserRepository.GetCredentialsByUsername(username)
	if err != nil {
		logger.Global.Error(err.Error())
		return nil, services.CreateError("failed to retrieve credential")
	}

	credential_id_list := extractCredentialIDs(credentials)
	credential_list := extractCredentialPKs(credentials)

	if recovery_pk != "" {

		recovery := user.UserRecovery{PublicKey: recovery_pk}
		// save recovery public key
		err = algo.UserRepository.SaveRecovery(username, recovery)
		if err != nil {
			logger.Global.Error(err.Error())
			return nil, services.CreateError("failed to setup recovery")
		}
	}

	contractAccount, err := algo.AlgoNet.GenerateContractAccount(credential_list, recovery_pk, false)
	if err != nil {
		logger.Global.Error(err.Error())
		return nil, services.CreateError("failed to generate Algorand account")
	}

	// create AlgoAccount
	account := AlgoAccount{
		Alias:           "Default Algorand Account",
		Address:         contractAccount.Address,
		TealVersion:     CURRENT_TEAL_VERSION,
		TealScript:      contractAccount.TealScript,
		CompileScript:   contractAccount.CompileScript,
		CredentialsID:   convertStringArrayToText(credential_id_list),
		CredentialsPK:   convertStringArrayToText(credential_list),
		RecoveryAddress: recovery_pk,
		AccountStatus:   "new",
	}

	err = algo.AlgoRepository.AddAlgoAccount(username, &account)
	if err != nil {
		logger.Global.Error(err.Error())
		return nil, services.CreateError("create Algorand account error")
	}
	return &account, nil
}

func (algo *AlgoService) CheckUserDappConsent(genesisHash string, origin string, sender string) (string, string) {
	var key string
	for k, v := range ALGO_NETWORK_GENESIS {
		if v.Hash == genesisHash {
			key = k
			break
		}
	}
	if network, hasKey := ALGO_NETWORK[key]; hasKey {
		user, err := algo.AlgoRepository.CheckOriginPermission(sender, origin, network)
		if err != nil {
			return "", ""
		}
		account, err := algo.AlgoRepository.LookupAddress(sender)
		if err != nil {
			return "", ""
		}

		return user.Username, account.Alias
	}
	return "", ""
}

func (algo *AlgoService) AddEnableAccounts(username string, address_list []string, origin string, network string) (*Genesis, *services.ServiceError) {
	user, err := algo.UserRepository.GetUserByUsername(username)
	if err != nil {
		logger.Global.Error(err.Error())
		return nil, services.CreateError("no user found")
	}

	db_network := ALGO_NETWORK[network]
	if db_network == "" {
		return nil, services.CreateError("unsupported network")
	}
	genesis, found := ALGO_NETWORK_GENESIS[network]
	if !found {
		return nil, services.CreateError("unsupported network")
	}

	if len(address_list) == 0 {
		return nil, services.CreateError("no account selected")
	}

	if origin == "" {
		return nil, services.CreateError("missing origin")
	}
	for _, address := range address_list {
		enable := EnableAccount{
			UserID:        user.ID,
			WalletAddress: address,
			DappOrigin:    origin,
			Network:       db_network,
		}
		err := algo.AlgoRepository.AddEnableAccount(enable)
		if err != nil {
			return nil, services.CreateError("failed to update - try again later")
		}
	}

	return &genesis, nil
}

func (algo *AlgoService) GetEnableAccountList(username string) ([]EnableAccount, *services.ServiceError) {

	enableAccountList, err := algo.AlgoRepository.GetEnableAccountList(username)
	if err != nil {
		logger.Global.Error(err.Error())
		return enableAccountList, services.CreateError("failed to retrieve enable accounts - try again")
	}

	return enableAccountList, nil
}

func (algo *AlgoService) RevokeEnableAccount(ID string) *services.ServiceError {
	if err := algo.AlgoRepository.revokeEnableAccount(ID); err != nil {
		logger.Global.Error(err.Error())
		return services.CreateError("failed to revoke enable accounts - try again")
	}

	logger.Global.Info("Deleted")

	return nil

}

func (algo *AlgoService) SandnetDispenser(to string) (uint64, *services.ServiceError) {
	// deposit 10 ALGO
	amount, err := algo.AlgoNet.Dispenser(to, 10000000)
	if err != nil {
		return 0, services.CreateError("failed to deposit")
	}
	return amount, nil
}

func (algo *AlgoService) SandnetDispenserSign(txn string) (string, *services.ServiceError) {
	// deposit 10 ALGO
	stxn, err := algo.AlgoNet.DispenserSign(txn)
	if err != nil {
		return "", services.CreateError("failed to sign")
	}
	return stxn, nil
}

func (algo *AlgoService) SandnetDispenserPost(stxn_raw []string) (string, *services.ServiceError) {
	var signedGroup []byte
	for _, value := range stxn_raw {
		decode, _ := base64.StdEncoding.DecodeString(value)
		signedGroup = append(signedGroup, decode...)

	}
	var txID string
	stxn, err := algo.AlgoNet.PostTxn(txID, signedGroup)
	if err != nil {
		return "", services.CreateError("failed to sign")
	}
	return stxn, nil
}

func (algo *AlgoService) GetTransactionID(txn types.Transaction) string {
	return algo_crypto.GetTxID(txn)
}

type TxClaims struct {
	Issuer      string `json:"iss,omitempty"`
	Subject     string `json:"sub,omitempty"`
	Audience    string `json:"aud,omitempty"`
	Username    string `json:"udata,omitempty"`
	IssuedAt    int64  `json:"iat,omitempty"`
	ID          string `json:"jti,omitempty"`
	Nonce       string `json:"nonce,omitempty"`
	ServerNonce string `json:"server_nonce,omitempty"`
	TxHash      string `json:"tx_hash,omitempty"`
}

func (algo *AlgoService) SignedTransaction(txnRaw string, signData string, clientData string, authData string, jwt string, postNetwork bool) (string, string, *services.ServiceError) {
	txn, err := ParseTransaction(txnRaw)
	if err != nil {
		return "", "", services.CreateError("failed to parse txn")
	}
	// get sender logicsignature

	// get logic signature
	account, err := algo.AlgoRepository.GetAccountByAddressFull(txn.Sender.String())
	if err != nil {
		return "", "", services.CreateError("account not found")
	}

	// check for auth Address
	logicScript := account.CompileScript
	if account.AuthAddress != nil && account.AuthAccount != nil {
		logicScript = account.AuthAccount.CompileScript
	}
	program, err := base64.StdEncoding.DecodeString(logicScript)
	if err != nil {
		return "", "", services.CreateError("account script error")
	}

	// build args
	// extract nonce, server_challenge from jwt
	var claims TxClaims
	err = utils.ParseClaims(jwt, &claims)
	if err != nil {
		return "", "", services.CreateError("invalid txn claim")
	}
	sig1, sig2, err := utils.ConvertSignatureRS(signData)
	if err != nil {
		return "", "", services.CreateError("invalid txn signature")
	}
	/*
		client_data_b64, err := utils.ConvertBase64UrlToBase64(clientData)
		if err != nil {
			logger.Global.Error(fmt.Sprintf("invalid client_data %v", err))
			return "", "", services.CreateError("invalid txn signature")
		}*/
	client_data_byte, err := base64.RawURLEncoding.DecodeString(clientData)
	if err != nil {
		logger.Global.Error(fmt.Sprintf("invalid client_data %v", err))
		return "", "", services.CreateError("invalid txn signature")
	}
	auth_data_byte, err := base64.RawURLEncoding.DecodeString(authData)
	if err != nil {
		logger.Global.Error(fmt.Sprintf("invalid auth_data %v", err))
		return "", "", services.CreateError("invalid txn signature")
	}
	server_challenge_byte := []byte(claims.ServerNonce)
	nonce_byte := []byte(claims.Nonce)
	payload_byte := []byte(TxIDFromTransactionB64(*txn))

	// string parameter
	arg_len := 6
	if account.TealVersion == 0 {
		arg_len = 7
	}

	args := make([][]byte, arg_len)
	args[0] = sig1
	args[1] = sig2
	args[2] = client_data_byte
	args[3] = auth_data_byte

	if account.TealVersion == 0 {

		args[4] = server_challenge_byte
		args[5] = nonce_byte
		args[6] = payload_byte
	} else {
		args[4] = append(nonce_byte, server_challenge_byte...)
		args[5] = payload_byte
	}

	lsig, err := MakeLogicSig(program, args)
	if err != nil {
		logger.Global.Error(fmt.Sprintf("make logicsig failed with %v", err))
		return "", "", services.CreateError("invalid txn signature")
	}

	txID, stx, err := SignLogicsigTransaction(lsig, *txn)
	if err != nil {
		logger.Global.Error(fmt.Sprintf("Signing failed with %v", err))
		return "", "", services.CreateError("invalid txn signature")
	}

	if postNetwork {
		_, err := algo.AlgoNet.PostTxn(txID, stx)
		if err != nil {
			fmt.Printf("Error posting on txID %s: %s\n", txID, err.Error())
			return "", "", services.CreateError("failed to submit transaction")
		}
	}
	stx_b64 := base64.StdEncoding.EncodeToString(stx)

	return txID, stx_b64, nil

}

func (s *AlgoService) GetAccountInfo(username string) ([]models.Account, *services.ServiceError) {
	var accountInfo []models.Account
	accounts, err := s.AlgoRepository.GetAccountList(username)
	if err != nil {
		logger.Global.Error(err.Error())
		return accountInfo, services.CreateError("no account info")
	}
	for _, account := range accounts {
		acc, err := s.Indexer.GetAccountsByID(account.Address)
		if err != nil {
			logger.Global.Error(err.Error())
			return accountInfo, services.CreateError("no account info")
		}
		accountInfo = append(accountInfo, *acc)
	}
	return accountInfo, nil
}

func (s *AlgoService) GetTransaction(address string) (*models.TransactionsResponse, *services.ServiceError) {

	transactions, err := s.Indexer.GetTransactionByAccount(address)
	if err != nil {
		logger.Global.Error(err.Error())
		return transactions, services.CreateError("transaction error")
	}
	return transactions, nil
}

func extractCredentialPKs(credentials []user.UserCredential) []string {
	var credList []string
	for _, cred := range credentials {
		credList = append(credList, cred.PublicKey)
	}
	return credList
}

func extractCredentialIDs(credentials []user.UserCredential) []string {
	var credList []string
	for _, cred := range credentials {
		credList = append(credList, cred.ID)
	}
	return credList
}

func convertStringArrayToText(strArray []string) string {
	text := ""
	for i, value := range strArray {
		if i > 0 {
			text = text + ","
		}
		text = text + value
	}
	return text
}

func convertTextToStringArray(arrayText string) []string {
	return strings.Split(arrayText, ",")
}

func MakeLogicSig(program []byte, args [][]byte) (lsig types.LogicSig, err error) {
	lsig.Logic = program
	lsig.Args = args
	return
}

// SignLogicsigTransaction takes LogicSig object and a transaction and returns the
// bytes of a signed transaction ready to be broadcasted to the network
// Note, LogicSig actually can be attached to any transaction and it is a
// program's responsibility to approve/decline the transaction
//
// This function supports signing transactions with a sender that differs from
// the LogicSig's address, EXCEPT IF the LogicSig is delegated to a non-multisig
// account. In order to properly handle that case, create a LogicSigAccount and
// use SignLogicSigAccountTransaction instead.
func SignLogicsigTransaction(lsig types.LogicSig, tx types.Transaction) (txid string, stxBytes []byte, err error) {

	lsigAddress := crypto.LogicSigAddress(lsig)
	txid, stxBytes, err = signLogicSigTransactionWithAddress(lsig, lsigAddress, tx)
	return
}

// txIDFromTransaction is a convenience function for generating txID from txn
func txIDFromTransaction(tx types.Transaction) (txid string) {
	txidBytes := crypto.TransactionID(tx)
	txid = base32.StdEncoding.WithPadding(base32.NoPadding).EncodeToString(txidBytes[:])
	return
}

// txIDFromTransactionB64 is a convenience function for generating txID from txn
func TxIDFromTransactionB64(tx types.Transaction) (txid string) {
	txidBytes := crypto.TransactionID(tx)
	txid = base64.URLEncoding.EncodeToString(txidBytes[:])
	return
}

func TxnRaw(tx types.Transaction) string {
	txBytes := msgpack.Encode(tx)
	return base64.URLEncoding.EncodeToString(txBytes)
}

// signLogicSigTransactionWithAddress signs a transaction with a LogicSig.
//
// lsigAddress is the address of the account that the LogicSig represents.
func signLogicSigTransactionWithAddress(lsig types.LogicSig, lsigAddress types.Address, tx types.Transaction) (txid string, stxBytes []byte, err error) {

	txid = txIDFromTransaction(tx)
	// Construct the SignedTxn
	stx := types.SignedTxn{
		Lsig: lsig,
		Txn:  tx,
	}

	if stx.Txn.Sender != lsigAddress {
		stx.AuthAddr = lsigAddress
	}

	// Encode the SignedTxn
	stxBytes = msgpack.Encode(stx)
	return
}

type ChangeAccount struct {
	AddCreds       []user.UserCredential
	RemoveCreds    []user.UserCredential
	AddRecovery    string
	RemoveRecovery string
}

func (s *AlgoService) compareAccount(username string, src AlgoAccount, dst AlgoAccount) *ChangeAccount {
	var changed ChangeAccount
	if src.RecoveryAddress != dst.RecoveryAddress {
		changed.AddRecovery = dst.RecoveryAddress
		changed.RemoveRecovery = src.RecoveryAddress
	}

	// split credentials into array
	srcCredentials := strings.Split(src.CredentialsID, ",")
	dstCredentials := strings.Split(dst.CredentialsID, ",")

	addCredIds := compareArrayNegative(dstCredentials, srcCredentials)
	removeCredIds := compareArrayNegative(srcCredentials, dstCredentials)

	if len(addCredIds) > 0 {
		credentials, err := s.UserRepository.LookupCredentials(username, addCredIds)
		if err != nil {
			logger.Global.Error(err.Error())
			return nil
		}
		changed.AddCreds = credentials
	}

	if len(removeCredIds) > 0 {
		credentials, err := s.UserRepository.LookupCredentials(username, removeCredIds)
		if err != nil {
			logger.Global.Error(err.Error())
			return nil
		}
		changed.RemoveCreds = credentials
	}

	return &changed
}

// compare element not found in dst array
func compareArrayNegative(src []string, dst []string) []string {
	var diff []string
	for _, aCredId := range src {
		found := false
		for _, bCredId := range dst {
			if aCredId == bCredId {
				found = true
				break
			}
		}

		if !found {
			diff = append(diff, aCredId)
		}
	}
	return diff
}
