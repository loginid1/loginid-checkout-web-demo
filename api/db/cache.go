package db

import (
	"context"
	"crypto/tls"
	"fmt"
	"os"

	"github.com/redis/go-redis/v9"
	goutil "gitlab.com/loginid/software/libraries/goutil.git"
	logger "gitlab.com/loginid/software/libraries/goutil.git/logger"
)

var rdb *redis.Client
var redisTLS = goutil.GetEnv("REDIS_TLS", "false") == "true"

func InitCacheClient() {
	options := &redis.Options{
		Addr:       fmt.Sprintf("%s", goutil.GetEnv("REDIS_URL", "redis:6379")),
		Password:   fmt.Sprintf("%s", goutil.GetEnv("REDIS_PASSWORD", "")),
		PoolSize:   20,
		MaxRetries: 2,
		DB:         0,
	}

	if redisTLS {
		options.TLSConfig = &tls.Config{
			MinVersion: tls.VersionTLS12,
		}
	}

	ctx := context.Background()
	rdb = redis.NewClient(options)
	pong, err := rdb.Ping(ctx).Result()
	if err != nil {
		logger.Global.Error(fmt.Sprintf("failed to load redis: %s", err.Error()))
		os.Exit(1)
	}
	fmt.Printf("ping redis: %s ", pong)
}

func GetCacheClient() *redis.Client {
	return rdb
}

func IsRedisNil(err error) bool {
	return err == redis.Nil
}
