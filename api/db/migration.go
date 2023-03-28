package db

import (
	"database/sql"
	"fmt"
	"os"

	"github.com/golang-migrate/migrate/v4"
	"github.com/golang-migrate/migrate/v4/database"
	"github.com/golang-migrate/migrate/v4/database/cockroachdb"
	"github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	goutil "gitlab.com/loginid/software/libraries/goutil.git"
	logger "gitlab.com/loginid/software/libraries/goutil.git/logger"
)

// MigrateUp
func MigrateUp() {
	dbName := goutil.GetEnv("DBNAME", "app_vault") // old var

	sqlConnStr := goutil.ConnStringFromEnv(dbName, "public")

	//logger.Global.Info(sqlConnStr)
	db, err := sql.Open("postgres", sqlConnStr)
	if err != nil {
		logger.Global.Error(fmt.Sprintf("failed to open database: %s", err.Error()))
		os.Exit(1)
	}

	isCockroach := goutil.GetEnv("COCKROACHDB_MIGRATION", "false")

	var driver database.Driver

	if isCockroach == "true" {
		driver, err = cockroachdb.WithInstance(db, &cockroachdb.Config{})
	} else {
		driver, err = postgres.WithInstance(db, &postgres.Config{})
	}

	if err != nil {
		logger.Global.Error(fmt.Sprintf("failed to config database: %s", err.Error()))
		os.Exit(1)
	}

	m, err := migrate.NewWithDatabaseInstance(
		"file://db/migrations",
		dbName, driver)

	if err != nil {
		logger.Global.Panic(fmt.Sprintf("failed to setup migration: %s", err.Error()))
		os.Exit(1)
	}
	// migrate to latest

	err = m.Up()
	if err != nil && err != migrate.ErrNoChange {
		logger.Global.Panic(fmt.Sprintf("failed to migrate: %s", err.Error()))
		os.Exit(1)
		//_ = m.Force(202104270001)
	}
	//reverse last change
	/*
		err = m.Steps(-1)
		if err != nil {
			logger.Global.Error(fmt.Sprintf("failed to reverse: %s", err.Error()))
		}*/
	// force previous version
	/*
		err = m.Force(2023032101)
		if err != nil {
			logger.Global.Error(fmt.Sprintf("failed to force version: %s", err.Error()))
		}
	*/

}
