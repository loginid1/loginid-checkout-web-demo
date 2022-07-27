package algo

import (
	"context"
	"encoding/json"
	"errors"
	"strconv"
	"time"

	"github.com/algorand/go-algorand-sdk/client/v2/common/models"
	"github.com/algorand/go-algorand-sdk/client/v2/indexer"
	"github.com/allegro/bigcache"
)

type AlgorandIndexerService struct {
	client     *indexer.Client
	assetCache *bigcache.BigCache
}

func NewAlgorandIndexerService() (*AlgorandIndexerService, error) {
	const indexerAddress = "http://localhost:8980"
	const indexerToken = ""
	indexerClient, err := indexer.MakeClient(indexerAddress, indexerToken)
	if err != nil {
		return nil, err
	}
	assetCache, err := bigcache.NewBigCache(bigcache.DefaultConfig(60 * time.Minute))
	if err != nil {
		return nil, errors.New("fail to initialize big cache ")
	}
	return &AlgorandIndexerService{client: indexerClient, assetCache: assetCache}, nil
}

func (s *AlgorandIndexerService) GetAccountsByID(address string) (*models.Account, error) {
	// Lookup account
	_, result, err := s.client.LookupAccountByID(address).Do(context.Background())
	if err != nil {
		return nil, err
	}
	return &result, nil
}

func (s *AlgorandIndexerService) GetTransactionByAccount(address string, limit uint64) (*models.TransactionsResponse, error) {
	// Lookup account
	result, err := s.client.SearchForTransactions().AddressString(address).Limit(limit).Do(context.Background())
	if err != nil {
		return nil, err
	}
	return &result, nil
}

func (s *AlgorandIndexerService) GetAssetByAccount(address string) (*models.AssetHoldingsResponse, error) {
	// Lookup account
	result, err := s.client.LookupAccountAssets(address).Do(context.Background())
	if err != nil {
		return nil, err
	}
	return &result, nil
}

func (s *AlgorandIndexerService) CheckAccountAssetID(address string, assetid uint64) (bool, error) {
	// Lookup account
	result, err := s.client.LookupAccountAssets(address).AssetID(assetid).Do(context.Background())
	if err != nil {
		return false, err
	}
	if len(result.Assets) == 1 {
		return true, nil
	} else {
		return false, nil
	}
}

func (s *AlgorandIndexerService) GetAssetByID(assetid uint64) (*models.Asset, error) {

	var result models.Asset
	key := strconv.FormatUint(assetid, 10)
	// check cache
	assetByte, _ := s.assetCache.Get(key)
	if len(assetByte) > 0 {
		err := json.Unmarshal(assetByte, &result)
		if err != nil {
			return nil, err
		}
		return &result, nil
	}
	// get asset from indexer if no cache match
	_, result, err := s.client.LookupAssetByID(assetid).Do(context.Background())
	if err != nil {
		return nil, err
	}
	assetByte, _ = json.Marshal(result)
	if len(assetByte) > 0 {
		s.assetCache.Set(key, assetByte)
	}

	return &result, nil
}

func (s *AlgorandIndexerService) GetAssetByName(name string) ([]models.Asset, error) {

	// get asset from indexer if no cache match
	result, err := s.client.SearchForAssets().Name(name).Do(context.Background())

	if err != nil {
		return nil, err
	}

	return result.Assets, nil
}
