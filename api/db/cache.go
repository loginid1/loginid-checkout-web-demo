package db

import (
	"crypto/tls"
	"fmt"
	"os"

	"github.com/go-redis/redis"
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

	rdb = redis.NewClient(options)
	pong, err := rdb.Ping().Result()
	fmt.Println(pong, err)
	if err != nil {
		logger.Global.Error(fmt.Sprintf("failed to load redis: %s", err.Error()))
		os.Exit(1)
	}
}

func GetCacheClient() *redis.Client {
	return rdb
}

func IsRedisNil(err error) bool {
	return err == redis.Nil
}
