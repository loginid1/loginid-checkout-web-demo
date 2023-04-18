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
	"github.com/algorand/go-algorand-sdk/crypto"
	"github.com/algorand/go-algorand-sdk/encoding/msgpack"
	"github.com/algorand/go-algorand-sdk/future"
	"github.com/algorand/go-algorand-sdk/mnemonic"
	"github.com/algorand/go-algorand-sdk/transaction"
	"github.com/algorand/go-algorand-sdk/types"
	"gitlab.com/loginid/software/libraries/goutil.git"
	"gitlab.com/loginid/software/libraries/goutil.git/logger"
	"gitlab.com/loginid/software/services/loginid-vault/services"
	"gitlab.com/loginid/software/services/loginid-vault/utils"
)

const MAX_CRECRENTIAL = 3

var fido_x_template = [MAX_CRECRENTIAL]string{"FIDO1111XXXX", "FIDO2222XXXX", "FIDO3333XXXX"}
var fido_y_template = [MAX_CRECRENTIAL]string{"FIDO1111YYYY", "FIDO2222YYYY", "FIDO3333YYYY"}

const recovery_template = "RRRRR55555RRRRR55555RRRRR55555RRRRR55555RRRRR5555522224444"

const CURRENT_TEAL_VERSION = 2

var script_template = map[string]string{
	"fido_1_recovery": "services/algo/scripts/fido_1_recovery.template2.teal",
	"fido_2_recovery": "services/algo/scripts/fido_2_recovery.template2.teal",
	"fido_3_recovery": "services/algo/scripts/fido_3_recovery.template2.teal",
	"fido_1":          "services/algo/scripts/fido_1.template2.teal",
	"fido_2":          "services/algo/scripts/fido_2.template2.teal",
	"fido_3":          "services/algo/scripts/fido_3.template2.teal",
}

type AlgorandNetworkService struct {
	client *algod.Client
}

func NewAlgorandNeworkService() (*AlgorandNetworkService, error) {
	// Create an algod client
	algodAddress := goutil.GetEnv("ALGONODE_URL", "http://localhost:4001")
	//algodToken := "cd2d8c9f6ef7a1700951e1253fc8d4e67674894aa6cebf51d34cf6d0b5b15a32" // contents of algod.token
	algodToken := goutil.GetEnv("ALGONODE_TOKEN", "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa") // contents of algod.token
	algodClient, err := algod.MakeClient(algodAddress, algodToken)
	//commonClient, err := common.MakeClient(algodAddress, "X-API-Key", algodToken)
	if err != nil {
		return nil, err
	}
	//algodClient := (*algod.Client)(commonClient)
	//genesis, err := algodClient.GetGenesis().Do(context.Background())

	return &AlgorandNetworkService{client: algodClient}, nil
}

type ContractAccount struct {
	Address       string `json:"address"`
	TealScript    string `json:"teal_script"`
	CompileScript string `json:"compile_script"`
}

func (as *AlgorandNetworkService) GenerateContractAccount(pkList []string, recovery string, require_recovery bool) (*ContractAccount, error) {

	if require_recovery && recovery == "" {
		return nil, errors.New("missing recovery")
	}
	if len(pkList) == 0 {
		return nil, fmt.Errorf("atleast one credential required")
	}
	if len(pkList) > MAX_CRECRENTIAL {
		return nil, fmt.Errorf("maximum %d credentials", MAX_CRECRENTIAL)
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

func (as *AlgorandNetworkService) Dispenser(to string, amount uint64) (uint64, error) {
	passphrase := goutil.GetEnv("DISPENSER_MNEMONIC", "")
	if passphrase == "" {
		return 0, errors.New("no dispenser")
	}
	privateKey, err := mnemonic.ToPrivateKey(passphrase)
	if err != nil {
		fmt.Printf("Issue with mnemonic conversion: %s\n", err)
		return 0, err
	}

	dAddress := goutil.GetEnv("DISPENSER_ADDRESS", "")
	if dAddress == "" {
		return 0, errors.New("no dispenser")
	}
	fmt.Printf("My address: %s\n", dAddress)

	accountInfo, err := as.client.AccountInformation(dAddress).Do(context.Background())
	if err != nil {
		fmt.Printf("Error getting account info: %s\n", err)
		return 0, err
	}
	fmt.Printf("Account balance: %d microAlgos\n", accountInfo.Amount)

	txParams, err := as.client.SuggestedParams().Do(context.Background())
	if err != nil {
		fmt.Printf("Error getting suggested tx params: %s\n", err)
		return 0, err
	}
	// comment out the next two (2) lines to use suggested fees
	txParams.FlatFee = true
	txParams.Fee = 1000

	fromAddr := dAddress
	toAddr := to
	var minFee uint64 = 1000
	note := []byte("Sandnet Dispenser")
	genID := txParams.GenesisID
	genHash := txParams.GenesisHash
	firstValidRound := uint64(txParams.FirstRoundValid)
	lastValidRound := uint64(txParams.LastRoundValid)

	txn, err := transaction.MakePaymentTxnWithFlatFee(fromAddr, toAddr, minFee, amount, firstValidRound, lastValidRound, note, "", genID, genHash)
	if err != nil {
		fmt.Printf("Error creating transaction: %s\n", err)
		return 0, err
	}

	txID, signedTxn, err := crypto.SignTransaction(privateKey, txn)
	if err != nil {
		fmt.Printf("Failed to sign transaction: %s\n", err)
		return 0, err
	}
	fmt.Printf("Signed txid: %s\n", txID)

	sendResponse, err := as.client.SendRawTransaction(signedTxn).Do(context.Background())
	if err != nil {
		fmt.Printf("failed to send transaction: %s\n", err)
		return 0, err
	}
	fmt.Printf("Submitted transaction %s\n", sendResponse)

	// Wait for confirmation
	confirmedTxn, err := future.WaitForConfirmation(as.client, txID, 4, context.Background())
	if err != nil {
		fmt.Printf("Error waiting for confirmation on txID: %s\n", txID)
		return 0, err
	}
	fmt.Printf("Confirmed Transaction: %s in Round %d\n", txID, confirmedTxn.ConfirmedRound)

	toInfo, err := as.client.AccountInformation(to).Do(context.Background())
	if err != nil {
		fmt.Printf("Error getting account info: %s\n", err)
		return 0, err
	}
	fmt.Printf("Account balance for %s: %d microAlgos\n", toInfo.Address, toInfo.Amount)
	return toInfo.Amount, nil
}

func (as *AlgorandNetworkService) DispenserSign(txnRaw string) (string, error) {
	passphrase := goutil.GetEnv("DISPENSER_MNEMONIC", "")
	if passphrase == "" {
		return "", errors.New("no dispenser")
	}
	privateKey, err := mnemonic.ToPrivateKey(passphrase)
	if err != nil {
		fmt.Printf("Issue with mnemonic conversion: %s\n", err)
		return "", err
	}

	dAddress := goutil.GetEnv("DISPENSER_ADDRESS", "")
	if dAddress == "" {
		return "", errors.New("no dispenser")
	}
	fmt.Printf("My address: %s\n", dAddress)

	txn, err := ParseTransaction(txnRaw)
	if err != nil {
		return "", errors.New("fail to parse transaction")
	}

	txID, signedTxn, err := crypto.SignTransaction(privateKey, *txn)
	if err != nil {
		fmt.Printf("Failed to sign transaction: %s\n", err)
		return "", err
	}
	fmt.Printf("Signed txid: %s\n", txID)

	return B64Transaction(signedTxn), nil
}

func (as *AlgorandNetworkService) PostTxn(transactionID string, stx []byte) (string, error) {

	// Submit the raw transaction to network
	transactionID, err := as.client.SendRawTransaction(stx).Do(context.Background())
	if err != nil {
		fmt.Printf("Sending failed with %v\n", err)
		return "", err
	}

	// Wait for confirmation
	confirmedTxn, err := future.WaitForConfirmation(as.client, transactionID, 4, context.Background())
	if err != nil {
		fmt.Printf("Error waiting for confirmation on txID: %s\n", transactionID)
		return "", err
	}
	fmt.Printf("Confirmed Transaction: %s in Round %d\n", transactionID, confirmedTxn.ConfirmedRound)

	return transactionID, nil
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

// EncodeTransactionB64 encodes types.Transaction to msgpack base64url string
func EncodeTransactionB64(txn types.Transaction) string {
	raw := msgpack.Encode(txn)
	return base64.StdEncoding.EncodeToString(raw)
}

func B64Transaction(txn []byte) string {
	return base64.StdEncoding.EncodeToString(txn)
}
