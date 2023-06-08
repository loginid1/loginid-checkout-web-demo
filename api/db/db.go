package db

import (
	"fmt"
	"os"
	"strconv"
	"time"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"

	goutil "gitlab.com/loginid/software/libraries/goutil.git"
	logger "gitlab.com/loginid/software/libraries/goutil.git/logger"
)

var dbName = goutil.GetEnv("POSTGRES_DB", "app_vault")

var db *gorm.DB

const databaseRetryAttempts int = 5

func GetConnection() *gorm.DB {
	return db
}

func CreateConnection() *gorm.DB {
	config := gorm.Config{
		// Critical flag to prevent update/delete without where clause or when primary key use is empty or 0
		// May need to evaluate GORM further to blok any other dangerous operations
		AllowGlobalUpdate: false,
	}

	var err error = nil
	for i := 0; i <= databaseRetryAttempts; i++ {
		db, err = gorm.Open(postgres.Open(goutil.ConnStringFromEnv(dbName, "public")), &config)
		if err != nil {
			if i == databaseRetryAttempts {
				logger.Global.Error(fmt.Sprintf("failed to connect to the database: %s", err))
			}
			logger.Global.Error(fmt.Sprintf("failed to connect to the database: %s. retrying in 5 seconds", err))
			time.Sleep(5 * time.Second)
		}
	}

	maxConnections, err := strconv.Atoi(goutil.GetEnv("DB_MAX_CONNECTIONS", "10"))
	if err != nil {
		logger.Global.Error("invalid db_max_connections value")
	}

	sqldb, err := db.DB()
	if err != nil {
		logger.Global.Error("Bad DB connection")
		panic(err)
	}

	sqldb.SetConnMaxLifetime(30 * time.Minute)
	sqldb.SetMaxIdleConns(maxConnections)
	sqldb.SetMaxOpenConns(maxConnections)
	if debug, _ := strconv.ParseBool(os.Getenv("DEBUG")); debug == true {
		db = db.Debug()
	}
	logger.Global.Info("connected to the database")

	return db
}

func CreateDatabase() {
	skipDB := goutil.GetEnv("SKIP_DB_CREATION", "false")
	if skipDB == "true" {
		logger.Global.Info("skipping database creation")
		return
	}
	db, err := gorm.Open(postgres.Open(goutil.ConnStringFromEnv("postgres", "public")))
	if err != nil {
		logger.Global.Error(fmt.Sprintf("failed to connect to the database: %v", err))
	}
	defer func() {
		sqldb, _ := db.DB()
		if err := sqldb.Close(); err != nil {
			logger.Global.Error(fmt.Sprintf("failed to close the database connection: %v", err))
		}
	}()
	if err := db.Exec(fmt.Sprintf("CREATE DATABASE %s;", dbName)).Error; err != nil {
		return
	}
	logger.Global.Info("created database")
}
