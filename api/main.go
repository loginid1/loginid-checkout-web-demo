package main

import (
	"fmt"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/gorilla/mux"
	"github.com/rs/cors"
	goutil "gitlab.com/loginid/software/libraries/goutil.git"
	logger "gitlab.com/loginid/software/libraries/goutil.git/logger"
	"gitlab.com/loginid/software/services/loginid-vault/db"
	"gitlab.com/loginid/software/services/loginid-vault/http/handlers"
	"gitlab.com/loginid/software/services/loginid-vault/http/middlewares"
	"gitlab.com/loginid/software/services/loginid-vault/services/algo"
	"gitlab.com/loginid/software/services/loginid-vault/services/app"
	"gitlab.com/loginid/software/services/loginid-vault/services/fido2"
	"gitlab.com/loginid/software/services/loginid-vault/services/keystore"
	notification "gitlab.com/loginid/software/services/loginid-vault/services/notification/providers"
	"gitlab.com/loginid/software/services/loginid-vault/services/pass"
	"gitlab.com/loginid/software/services/loginid-vault/services/sendwyre"
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

	db.InitCacheClient()

	// init services

	keystoreService, err := keystore.NewKeystoreService(db.GetConnection())
	if err != nil {
		logger.Global.Fatal(err.Error())
		os.Exit(0)
	}
	err = keystoreService.InitKeystore()
	if err != nil {
		logger.Global.Fatal(err.Error())
		os.Exit(0)
	}

	userService, err := user.NewUserService(db.GetConnection())
	if err != nil {
		logger.Global.Fatal(err.Error())
		os.Exit(0)
	}

	apiClientID := goutil.GetEnv("FIDO_API_ID", "iBlHjpbHGYEp1JdCEn4ZMx-p6V9xBbwLbMn9R8sQNOqRgeLzCm5OxWhdEsVEv7q9lPyA32KuZqOpMaIVIsOiZA")
	apiPem := goutil.GetEnv("API_PRIVATE_KEY", "LS0tLS1CRUdJTiBQUklWQVRFIEtFWS0tLS0tCk1JR0hBZ0VBTUJNR0J5cUdTTTQ5QWdFR0NDcUdTTTQ5QXdFSEJHMHdhd0lCQVFRZ0RDNHNHSnZNSjFUcjJtY0IKT05sUmJTRG9CWFRiak1ZdE1DTXNXRER6YURxaFJBTkNBQVRkV29qVEhCejZMVTlOMGhHYUhlTU9MZkdVZ0ZxUgpDOGRvMU1SL3pZL3YwSzVzYTJROXpmNUIxMUZNTm9UWXZwVCtqQmFVNTB5SkFwblN1VVhkVmJiUAotLS0tLUVORCBQUklWQVRFIEtFWS0tLS0t")
	clientID := goutil.GetEnv("FIDO_CLIENT_ID", "3Tn8S4chICTf2cy6TdciBJXJFZgpcVJcFiRAIb0zuo21jaA_4W2BCnVrqBIoY04dr12W47bYGrZRlPlzyVD30Q")
	baseURL := goutil.GetEnv("FIDO_BASEURL", "https://directweb.qa.loginid.io")
	jwtURL := baseURL
	fidoService, err := fido2.NewFido2Service(clientID, baseURL, apiClientID, apiPem)
	if err != nil {
		logger.Global.Fatal(err.Error())
		os.Exit(0)
	}

	// initialize Sendwyre
	wyreAccount := goutil.GetEnv("SENDWYRE_ACCOUNT", "")
	wyreSecret := goutil.GetEnv("SENDWYRE_SECRET", "")
	wyreUrl := goutil.GetEnv("SENDWYRE_BASEURL", "")
	wyreRedirectUrl := goutil.GetEnv("SENDWYRE_REDIRECT_URL", "")

	wyreService, err := sendwyre.NewSendWyreService(wyreAccount, wyreSecret, wyreUrl, wyreRedirectUrl)
	if err != nil {
		logger.Global.Fatal(err.Error())
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

	appService := app.NewAppService(db.GetConnection(), db.GetCacheClient())

	notificationService := notification.NewTwillioProvider()
	passService := pass.NewPassService(db.GetConnection(), db.GetCacheClient(), notificationService)

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

	//federated auth handler
	federatedHandler := handlers.FederatedAuthHandler{UserService: userService, Fido2Service: fidoService, KeystoreService: keystoreService, RedisClient: db.GetCacheClient(), AppService: appService, PassService: passService}
	api.HandleFunc("/federated/checkuser", federatedHandler.CheckUserHandler)
	api.HandleFunc("/federated/sessionInit", federatedHandler.SessionInitHandler)
	api.HandleFunc("/federated/register/init", federatedHandler.FederatedRegisterInitHandler)
	api.HandleFunc("/federated/register/complete", federatedHandler.FederatedRegisterCompleteHandler)
	api.HandleFunc("/federated/authenticate/init", federatedHandler.FederatedAuthInitHandler)
	api.HandleFunc("/federated/authenticate/complete", federatedHandler.FederatedAuthCompleteHandler)
	api.HandleFunc("/federated/sendEmailSession", federatedHandler.FederatedSendEmailSessionHandler)
	api.HandleFunc("/federated/email/validation", federatedHandler.FederatedEmailValidationHandler)
	api.HandleFunc("/federated/email/ws/{session}", federatedHandler.FederatedEmailWSHandler)
	api.HandleFunc("/federated/checkConsent", federatedHandler.CheckConsentHandler)
	api.HandleFunc("/federated/saveConsent", federatedHandler.SaveConsentHandler)

	// protected usesr handler
	userHandler := handlers.UserHandler{UserService: userService, Fido2Service: fidoService, AppService: appService}
	algoHandler := handlers.AlgoHandler{UserService: userService, AlgoService: algoService, FidoService: fidoService, SendWyreService: wyreService}
	devHandler := handlers.DeveloperHandler{AppService: appService}
	protected := api.PathPrefix("/protected").Subrouter()
	protected.Use(authService.Middleware)
	protected.HandleFunc("/user/profile", userHandler.GetUserProfileHandler)
	protected.HandleFunc("/user/getCredentialList", userHandler.GetCredentialListHandler)
	protected.HandleFunc("/user/renameCredential", userHandler.RenameCredentialHandler)

	// deprecated in favour of generateRecoveryInit && generateRecoveryComplete flow
	protected.HandleFunc("/user/createRecovery", userHandler.CreateRecoveryHandler)
	protected.HandleFunc("/user/generateRecoveryInit", userHandler.GenerateRecoveryInitHandler)
	protected.HandleFunc("/user/generateRecoveryComplete", userHandler.GenerateRecoveryCompleteHandler)
	protected.HandleFunc("/user/getRecoveryList", userHandler.GetRecoveryListHandler)
	protected.HandleFunc("/user/getConsentList", userHandler.GetConsentList)
	protected.HandleFunc("/user/generateCredentialCode", userHandler.GenerateCredentialCodeHandler)

	protected.HandleFunc("/algo/getAccount", algoHandler.GetAccountHandler)
	protected.HandleFunc("/algo/getAccountList", algoHandler.GetAccountListHandler)
	protected.HandleFunc("/algo/createAccount", algoHandler.CreateAccountHandler)
	protected.HandleFunc("/algo/renameAccount", algoHandler.RenameAccountHandler)
	protected.HandleFunc("/algo/generateScript", algoHandler.GenerateScriptHandler)
	protected.HandleFunc("/algo/quickAccountCreation", algoHandler.QuickAccountCreationHandler)
	protected.HandleFunc("/algo/getEnableAccountList", algoHandler.GetEnableAccountListHandler)
	protected.HandleFunc("/algo/revokeEnableAccount", algoHandler.RevokeEnableAccountHandler)
	protected.HandleFunc("/algo/rekeyInit", algoHandler.RekeyInitHandler)
	protected.HandleFunc("/algo/rekeyComplete", algoHandler.RekeyCompleteHandler)

	// algo internal transaction
	protected.HandleFunc("/algo/createAssetOptin", algoHandler.AssetOptinHandler)
	protected.HandleFunc("/algo/createSendPayment", algoHandler.SendPaymentHandler)

	// algo purchase handler
	protected.HandleFunc("/algo/algoPurchaseInit", algoHandler.AlgoPurchaseRequestHandler)

	// balance & reporting
	protected.HandleFunc("/algo/getAccountInfo", algoHandler.GetAccountInfoHandler)
	protected.HandleFunc("/algo/getTransactions", algoHandler.GetTransactionHandler)
	protected.HandleFunc("/algo/getAssets", algoHandler.GetAssetHandler)

	// dev handlers
	protected.HandleFunc("/dev/createApp", devHandler.CreateApp)
	protected.HandleFunc("/dev/updateApp", devHandler.UpdateApp)
	protected.HandleFunc("/dev/getAppList", devHandler.GetAppList)

	// open transaction api handlers
	walletHandler := handlers.WalletHandler{UserService: userService, Fido2Service: fidoService, AlgoService: algoService, AuthService: authService}
	wallet := api.PathPrefix("/wallet").Subrouter()
	wallet.HandleFunc("/enable", walletHandler.EnableHandler)
	wallet.HandleFunc("/txValidation", walletHandler.TxValidationHandler)
	wallet.HandleFunc("/txInit", walletHandler.TxInitHandler)
	wallet.HandleFunc("/txComplete", walletHandler.TxCompleteHandler)

	// passes handlers
	passesHandler := handlers.PassesHandler{PassService: passService}
	passes := protected.PathPrefix("/passes").Subrouter()
	passes.HandleFunc("", passesHandler.List).Methods("GET")
	passes.HandleFunc("/{id}", passesHandler.Delete).Methods("DELETE")
	passes.HandleFunc("/phone/init", passesHandler.PhoneInit).Methods("POST")
	passes.HandleFunc("/phone/complete", passesHandler.PhoneComplete).Methods("POST")
	passes.HandleFunc("/drivers-license", passesHandler.DriversLicense).Methods("POST")

	// dispenser handler
	dispenserHandler := handlers.DispenserHandler{AlgoService: algoService}
	dispenser := api.PathPrefix("/dispenser").Subrouter()
	dispenser.HandleFunc("/deposit", dispenserHandler.DispenserDepositHandler)
	dispenser.HandleFunc("/sign", dispenserHandler.DispenserSignHandler)
	dispenser.HandleFunc("/post", dispenserHandler.DispenserPostHandler)

	cor_origins := goutil.GetEnv("CORS_ORIGINS", "http://localhost:3000,http://localhost:3010")
	cor_array := strings.Split(cor_origins, ",")
	//TODO: change CORS handling to middleware
	c := cors.New(cors.Options{
		AllowedOrigins:   cor_array,
		AllowCredentials: true,
		AllowedHeaders:   []string{"Content-Type", "X-Session-Token", "x-api-token"},
		AllowedMethods:   []string{"OPTIONS", "GET", "POST", "DELETE"},
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
