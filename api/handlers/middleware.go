package handlers

import (
	"context"
	"net/http"
	"strings"

	"gitlab.com/loginid/software/services/loginid-vault/services"
)

//TokenAuthenticationMiddleware - handle jwt validation
func TokenAuthenticationMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("x-session-token")
		// get authorization header if present
		if authHeader != "" {
			authToken := strings.TrimSpace(authHeader)
			// need to validate authToken and inject username to context
			username, err := validateToken(authToken)
			if err != nil {
				errorResponse(w, services.NewError("Not authorized"))
				return
			}
			ctx := context.WithValue(r.Context(), "username", username)
			next.ServeHTTP(w, r.WithContext(ctx))
			return
		}
		// fail not authorize here

		errorResponse(w, services.NewError("Not authorized"))

	})
}

func validateToken(token string) (string, error) {
	return "test7", nil
}
