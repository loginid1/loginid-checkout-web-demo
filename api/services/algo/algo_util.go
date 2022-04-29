package algo

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"io/ioutil"
	"strings"

	"github.com/algorand/go-algorand-sdk/client/v2/algod"
	"github.com/algorand/go-algorand-sdk/encoding/msgpack"
	"github.com/algorand/go-algorand-sdk/types"
	"gitlab.com/loginid/software/libraries/goutil.git/logger"
	"gitlab.com/loginid/software/services/loginid-vault/services"
	"gitlab.com/loginid/software/services/loginid-vault/utils"
)

var fido_template = [3]string{"AAAAA55555AAAAA55555AAAAA55555AAAAA55555AAAAA5555522224444",
	"BBBBB55555BBBBB55555BBBBB55555BBBBB55555BBBBB5555522224444",
	"CCCCC55555CCCCC55555CCCCC55555CCCCC55555CCCCC5555522224444"}

var fido_x_template = [2]string{"FIDO1111XXXX", "FIDO2222XXXX"}
var fido_y_template = [2]string{"FIDO1111YYYY", "FIDO2222YYYY"}

const recovery_template = "RRRRR55555RRRRR55555RRRRR55555RRRRR55555RRRRR5555522224444"

var script_template = map[string]string{
	"fido_1_recovery": "services/algo/scripts/fido_1_recovery.template.teal",
	"fido_2_recovery": "services/algo/scripts/fido_2_recovery.template.teal",
}

type AlgorandNetworkService struct {
	client *algod.Client
}

func NewAlgorandNeworkService() (*AlgorandNetworkService, error) {
	// Create an algod client
	algodAddress := "http://localhost:4001"
	//algodToken := "cd2d8c9f6ef7a1700951e1253fc8d4e67674894aa6cebf51d34cf6d0b5b15a32" // contents of algod.token
	algodToken := "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" // contents of algod.token
	algodClient, err := algod.MakeClient(algodAddress, algodToken)
	if err != nil {
		return nil, err
	}
	return &AlgorandNetworkService{client: algodClient}, nil
}

type ContractAccount struct {
	Address       string `json:"address"`
	TealScript    string `json:"teal_script"`
	CompileScript string `json:"compile_script"`
}

func (as *AlgorandNetworkService) GenerateContractAccount(pkList []string, recovery string) (*ContractAccount, error) {

	if recovery == "" {
		return nil, errors.New("missing recovery")
	}
	if len(pkList) > 2 {
		return nil, errors.New("maximum 2 credentials")
	}

	key := fmt.Sprintf("fido_%d", len(pkList))
	if recovery != "" {
		key = fmt.Sprintf("%s_recovery", key)
	}

	// load template
	teal_template, err := ioutil.ReadFile(script_template[key])
	if err != nil {
		logger.Global.Error(err.Error())
		return nil, errors.New("failed to load teal script")
	}

	// search and replace template content
	teal_script, err := updateTealScript(string(teal_template), pkList, recovery)
	if err != nil {
		logger.Global.Error(err.Error())
		return nil, errors.New("failed to update teal script")
	}

	// compile with algorand network
	address, compile_script, err := as.compile(teal_script)

	if err != nil {
		logger.Global.Error(err.Error())
		return nil, errors.New("failed to generate teal script")
	}

	return &ContractAccount{Address: address, TealScript: teal_script, CompileScript: compile_script}, nil
}

func (as *AlgorandNetworkService) compile(script string) (string, string, error) {
	compile_script := as.client.TealCompile([]byte(script))
	if compile_script == nil {
		return "", "", errors.New("failed to compile script")
	}
	response, err := compile_script.Do(context.Background())
	if err != nil {
		logger.Global.Error(err.Error())
		return "", "", errors.New("failed to compile script")

	}
	return response.Hash, response.Result, nil
}

func updateTealScript(script string, pkList []string, recovery string) (string, error) {
	for i, pk := range pkList {
		var jwk services.EccJWK
		// parse jwk
		err := json.Unmarshal([]byte(pk), &jwk)
		if err != nil {
			return "", err
		}
		base64_x, err := utils.ConvertBase64UrlToBase64(jwk.X)
		base64_y, err := utils.ConvertBase64UrlToBase64(jwk.Y)
		script = strings.Replace(script, fido_x_template[i], base64_x, 1)
		script = strings.Replace(script, fido_y_template[i], base64_y, 1)
	}
	if recovery != "" {
		script = strings.Replace(script, recovery_template, recovery, 1)
	}
	return script, nil
}

func ParseTransaction(txnRaw string) (*types.Transaction, error) {
	var txn types.Transaction
	decode, err := base64.StdEncoding.DecodeString(txnRaw)
	if err != nil {
		return nil, err
	}
	err = msgpack.Decode(decode, &txn)
	if err != nil {
		return nil, err
	}
	return &txn, nil
}
