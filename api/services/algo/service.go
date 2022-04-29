package algo

import (
	"strings"

	algo_crypto "github.com/algorand/go-algorand-sdk/crypto"
	"github.com/algorand/go-algorand-sdk/types"
	"gitlab.com/loginid/software/libraries/goutil.git/logger"
	"gitlab.com/loginid/software/services/loginid-vault/services"
	"gitlab.com/loginid/software/services/loginid-vault/services/user"
	"gorm.io/gorm"
)

type AlgoService struct {
	UserRepository *user.UserRepository
	AlgoRepository *AlgoRepository
	AlgoNet        *AlgorandNetworkService
}

// NewUserService
// initialize UserService struct
func NewAlgoService(db *gorm.DB) (*AlgoService, error) {

	algoNet, err := NewAlgorandNeworkService()
	if err != nil {
		return nil, err
	}
	algoService := AlgoService{
		UserRepository: &user.UserRepository{DB: db},
		AlgoRepository: &AlgoRepository{DB: db},
		AlgoNet:        algoNet,
	}
	return &algoService, nil
}

func (algo *AlgoService) CreateAccount(username string, verify_address string, credential_id_list []string, recovery string) *services.ServiceError {
	// get script from credential_list and recovery

	credentials, err := algo.UserRepository.LookupCredentials(username, credential_id_list)
	if err != nil {
		logger.Global.Error(err.Error())
		return services.CreateError("failed to validate credentials list")
	}

	credential_list := extractCredentialPKs(credentials)

	contractAccount, err := algo.AlgoNet.GenerateContractAccount(credential_list, recovery)
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
	if err != nil {
		return services.CreateError("address already existed! ")
	}

	// create AlgoAccount
	account := AlgoAccount{
		Alias:           contractAccount.Address,
		Address:         contractAccount.Address,
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

func (algo *AlgoService) GetAccountList(username string) ([]AlgoAccount, *services.ServiceError) {

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
	}

	return accountList, nil
}

func (algo *AlgoService) GenerateFido2Signature(credentialList []string, recovery string) (*ContractAccount, *services.ServiceError) {
	account, err := algo.AlgoNet.GenerateContractAccount(credentialList, recovery)
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

	recovery := user.UserRecovery{PublicKey: recovery_pk}
	// save recovery public key
	err = algo.UserRepository.SaveRecovery(username, recovery)
	if err != nil {
		logger.Global.Error(err.Error())
		return nil, services.CreateError("failed to setup recovery")
	}

	contractAccount, err := algo.AlgoNet.GenerateContractAccount(credential_list, recovery_pk)
	if err != nil {
		logger.Global.Error(err.Error())
		return nil, services.CreateError("failed to generate Algorand account")
	}

	// create AlgoAccount
	account := AlgoAccount{
		Alias:           contractAccount.Address,
		Address:         contractAccount.Address,
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

func (algo *AlgoService) CheckUserDappConsent(genesisHash string, origin string, sender string) string {
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
			return ""
		}
		return user.Username
	}
	return ""
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

func (algo *AlgoService) GetTransactionID(txn types.Transaction) string {
	return algo_crypto.GetTxID(txn)
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
