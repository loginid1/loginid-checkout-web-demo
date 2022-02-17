package algo

import (
	"strings"

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

	if algo.AlgoRepository.LookupAddress(verify_address) {
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

func extractCredentialPKs(credentials []user.UserCredential) []string {
	var credList []string
	for _, cred := range credentials {
		credList = append(credList, cred.PublicKey)
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
