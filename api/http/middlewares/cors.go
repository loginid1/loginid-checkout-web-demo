package middlewares

import (
	"fmt"
	"net/http"
	"strings"

	goutil "gitlab.com/loginid/software/libraries/goutil.git"
	"gitlab.com/loginid/software/libraries/goutil.git/logger"
)

var cors_origins = goutil.GetEnv("CORS_ORIGINS", "http://localhost:3000,http://localhost:3010")
var ALLOW_CORS = strings.Split(cors_origins, ",")

func PrivateCORSMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		//
		//logger.Global.Info(fmt.Sprintf("%s %s", r.Header.Get("Origin"), matchCorsDomains(r.Header.Get("Origin"))))
		w.Header().Set("Access-Control-Allow-Origin", matchCorsDomains(r.Header.Get("Origin")))
		w.Header().Set("Access-Control-Allow-Credentials", "true")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, X-Session-Token, x-api-token, Ngrok-Skip-Browser-Warning")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS")
		if r.Method == http.MethodOptions {
			return
		}
		next.ServeHTTP(w, r)
	})
}

func PublicCORSMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		//
		logger.Global.Info(fmt.Sprintf("public %s %s", r.Header.Get("Origin"), matchCorsDomains(r.Header.Get("Origin"))))
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Headers", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")

		if r.Method == http.MethodOptions {
			return
		}
		next.ServeHTTP(w, r)
	})
}

func matchCorsDomains(origin string) string {
	for _, domain := range ALLOW_CORS {
		if domain == origin {
			return domain
		}
	}
	return ALLOW_CORS[0]
}
