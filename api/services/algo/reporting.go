package algo

import (
	"context"

	"github.com/algorand/go-algorand-sdk/client/v2/common/models"
	"github.com/algorand/go-algorand-sdk/client/v2/indexer"
)

type AlgorandIndexerService struct {
	client *indexer.Client
}

func NewAlgorandIndexerService() (*AlgorandIndexerService, error) {
	const indexerAddress = "http://localhost:8980"
	const indexerToken = ""
	indexerClient, err := indexer.MakeClient(indexerAddress, indexerToken)
	if err != nil {
		return nil, err
	}
	return &AlgorandIndexerService{client: indexerClient}, nil
}

func (s *AlgorandIndexerService) GetAccountsByID(address string) (*models.Account, error) {
	// Lookup account
	_, result, err := s.client.LookupAccountByID(address).Do(context.Background())
	if err != nil {
		return nil, err
	}
	return &result, nil
}

func (s *AlgorandIndexerService) GetTransactionByAccount(address string) (*models.TransactionsResponse, error) {
	// Lookup account
	result, err := s.client.SearchForTransactions().AddressString(address).Do(context.Background())
	if err != nil {
		return nil, err
	}
	return &result, nil
}
