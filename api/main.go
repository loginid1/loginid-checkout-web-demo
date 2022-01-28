package main

import (
	"fmt"
	"net/http"
	"time"

	"github.com/gorilla/mux"
	"github.com/rs/cors"
	goutil "gitlab.com/loginid/software/libraries/goutil.git"
	logger "gitlab.com/loginid/software/libraries/goutil.git/logger"
	"gitlab.com/loginid/software/services/loginid-vault/db"
	"gitlab.com/loginid/software/services/loginid-vault/handlers"
	"gitlab.com/loginid/software/services/loginid-vault/services/fido2"
	"gitlab.com/loginid/software/services/loginid-vault/services/user"
)

func main() {

	logger.InitLogging("vault")
	// init core
	db.InitCacheClient()
	db.CreateConnection()
	// run upgrade migration if neccessary
	if goutil.GetEnvBool("ENABLE_AUTO_DBMIGRATION", false) {
		db.MigrateUp()
	}

	// init services
	userService, err := user.NewUserService(db.GetConnection(), db.GetCacheClient())
	if err != nil {
		logger.Global.Fatal(err.Error())
	}

	clientID := "3Tn8S4chICTf2cy6TdciBJXJFZgpcVJcFiRAIb0zuo21jaA_4W2BCnVrqBIoY04dr12W47bYGrZRlPlzyVD30Q"
	baseURL := "https://directweb.qa.loginid.io"
	fidoService := fido2.NewFido2Service(clientID, baseURL)

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

	// protected usesr handler
	userHandler := handlers.UserHandler{UserService: userService, Fido2Service: fidoService}
	protected := api.PathPrefix("/protected").Subrouter()
	protected.Use(handlers.TokenAuthenticationMiddleware)
	protected.HandleFunc("/user/profile", userHandler.GetUserProfileHandler)
	protected.HandleFunc("/user/getCredentialList", userHandler.GetCredentialListHandler)

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
