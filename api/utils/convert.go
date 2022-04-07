package utils

import "encoding/base64"

func ConvertBase64UrlToBase64(base64url string) (string, error) {
	value, err := base64.RawURLEncoding.DecodeString(base64url)
	if err != nil {
		return "", err
	}
	return base64.StdEncoding.EncodeToString(value), nil
}
