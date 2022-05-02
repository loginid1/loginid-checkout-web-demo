package main

import (
	"fmt"
	"net/http"
	"os"
	"time"

	"github.com/gorilla/mux"
	"github.com/rs/cors"
	goutil "gitlab.com/loginid/software/libraries/goutil.git"
	logger "gitlab.com/loginid/software/libraries/goutil.git/logger"
	"gitlab.com/loginid/software/services/loginid-vault/db"
	"gitlab.com/loginid/software/services/loginid-vault/http/handlers"
	"gitlab.com/loginid/software/services/loginid-vault/http/middlewares"
	"gitlab.com/loginid/software/services/loginid-vault/services/algo"
	"gitlab.com/loginid/software/services/loginid-vault/services/fido2"
	"gitlab.com/loginid/software/services/loginid-vault/services/user"
)

func main() {

	logger.InitLogging("vault")
	// init core
	db.CreateConnection()
	// run upgrade migration if neccessary
	if goutil.GetEnvBool("ENABLE_AUTO_DBMIGRATION", false) {
		db.MigrateUp()
	}

	// init services
	userService, err := user.NewUserService(db.GetConnection())
	if err != nil {
		logger.Global.Fatal(err.Error())
		os.Exit(0)
	}

	apiClientID := "iBlHjpbHGYEp1JdCEn4ZMx-p6V9xBbwLbMn9R8sQNOqRgeLzCm5OxWhdEsVEv7q9lPyA32KuZqOpMaIVIsOiZA"
	apiPem := "LS0tLS1CRUdJTiBQUklWQVRFIEtFWS0tLS0tCk1JR0hBZ0VBTUJNR0J5cUdTTTQ5QWdFR0NDcUdTTTQ5QXdFSEJHMHdhd0lCQVFRZ0RDNHNHSnZNSjFUcjJtY0IKT05sUmJTRG9CWFRiak1ZdE1DTXNXRER6YURxaFJBTkNBQVRkV29qVEhCejZMVTlOMGhHYUhlTU9MZkdVZ0ZxUgpDOGRvMU1SL3pZL3YwSzVzYTJROXpmNUIxMUZNTm9UWXZwVCtqQmFVNTB5SkFwblN1VVhkVmJiUAotLS0tLUVORCBQUklWQVRFIEtFWS0tLS0t"
	clientID := "3Tn8S4chICTf2cy6TdciBJXJFZgpcVJcFiRAIb0zuo21jaA_4W2BCnVrqBIoY04dr12W47bYGrZRlPlzyVD30Q"
	baseURL := "https://directweb.qa.loginid.io"
	jwtURL := "https://directweb.qa.loginid.io"
	fidoService, err := fido2.NewFido2Service(clientID, baseURL, apiClientID, apiPem)
	if err != nil {
		logger.Global.Fatal(err.Error())
		os.Exit(0)
	}
	authService, err := middlewares.NewAuthService(clientID, jwtURL)
	if err != nil {
		logger.Global.Fatal(err.Error())
		os.Exit(0)
	}

	algoService, err := algo.NewAlgoService(db.GetConnection())
	if err != nil {
		logger.Global.Fatal(err.Error())
		os.Exit(0)
	}

	// init http handlers & server
	r := mux.NewRouter()

	// serve front-end SPA
	spa := handlers.SpaHandler{StaticPath: "fe/build", IndexPath: "index.html", StripPrefix: "/fe"}
	r.PathPrefix("/fe").Handler(spa)

	api := r.PathPrefix("/api").Subrouter()
	// inject request ID for logging
	//api.Use(logger.InjectRequestIDMiddleware)

	//auth handler
	authHandler := handlers.AuthHandler{UserService: userService, Fido2Service: fidoService}
	api.HandleFunc("/register/init", authHandler.RegisterInitHandler)
	api.HandleFunc("/register/complete", authHandler.RegisterCompleteHandler)
	api.HandleFunc("/authenticate/init", authHandler.AuthenticateInitHandler)
	api.HandleFunc("/authenticate/complete", authHandler.AuthenticateCompleteHandler)
	api.HandleFunc("/addCredential/init", authHandler.AddCredentialInitHandler)
	api.HandleFunc("/addCredential/complete", authHandler.AddCredentialCompleteHandler)

	// protected usesr handler

	userHandler := handlers.UserHandler{UserService: userService, Fido2Service: fidoService}
	algoHandler := handlers.AlgoHandler{UserService: userService, AlgoService: algoService}
	protected := api.PathPrefix("/protected").Subrouter()
	protected.Use(authService.Middleware)
	protected.HandleFunc("/user/profile", userHandler.GetUserProfileHandler)
	protected.HandleFunc("/user/getCredentialList", userHandler.GetCredentialListHandler)
	// deprecated in favour of generateRecoveryInit && generateRecoveryComplete flow
	protected.HandleFunc("/user/createRecovery", userHandler.CreateRecoveryHandler)
	protected.HandleFunc("/user/generateRecoveryInit", userHandler.GenerateRecoveryInitHandler)
	protected.HandleFunc("/user/generateRecoveryComplete", userHandler.GenerateRecoveryCompleteHandler)
	protected.HandleFunc("/user/getRecoveryList", userHandler.GetRecoveryListHandler)
	protected.HandleFunc("/user/generateCredentialCode", userHandler.GenerateCredentialCodeHandler)

	protected.HandleFunc("/algo/getAccountList", algoHandler.GetAccountListHandler)
	protected.HandleFunc("/algo/createAccount", algoHandler.CreateAccountHandler)
	protected.HandleFunc("/algo/generateScript", algoHandler.GenerateScriptHandler)
	protected.HandleFunc("/algo/quickAccountCreation", algoHandler.QuickAccountCreationHandler)

	// open transaction api handlers

	walletHandler := handlers.WalletHandler{UserService: userService, Fido2Service: fidoService, AlgoService: algoService, AuthService: authService}
	wallet := api.PathPrefix("/wallet").Subrouter()
	wallet.HandleFunc("/enable", walletHandler.EnableHandler)
	wallet.HandleFunc("/txValidation", walletHandler.TxValidationHandler)
	wallet.HandleFunc("/txInit", walletHandler.TxInitHandler)
	wallet.HandleFunc("/txComplete", walletHandler.TxCompleteHandler)

	//TODO: change CORS handling to middleware
	c := cors.New(cors.Options{
		AllowedOrigins:   []string{"http://localhost", "http://localhost:3000"},
		AllowCredentials: true,
		AllowedHeaders:   []string{"Content-Type", "X-Session-Token"},
		// Enable Debugging for testing, consider disabling in production
		Debug: true,
	})

	corsHandler := c.Handler(r)

	port := goutil.GetEnv("PORT", "8000")
	srv := &http.Server{
		Handler: corsHandler,
		Addr:    fmt.Sprintf(":%s", port),
		// Good practice: enforce timeouts for servers you create!
		WriteTimeout: 15 * time.Second,
		ReadTimeout:  15 * time.Second,
	}

	err = srv.ListenAndServe()
	if err != nil {
		logger.Global.Fatal(err.Error())
	}

}
