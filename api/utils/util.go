package utils

import (
	"crypto/rand"
	"encoding/hex"
	"regexp"
	"time"
)

var email_regex = regexp.MustCompile(`^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$`)

func IsEmail(value string) bool {
	return email_regex.MatchString(value)
}

func Contains[T comparable](s []T, e T) bool {
	for _, v := range s {
		if v == e {
			return true
		}
	}
	return false
}

func GenerateRandomBytes(n int) ([]byte, error) {
	b := make([]byte, n)
	_, err := rand.Read(b)

	// Note that err == nil only if we read len(b) bytes.
	if err != nil {
		return nil, err
	}
	return b, nil
}

func GenerateRandomString(s int) (string, error) {
	b, err := GenerateRandomBytes(s)
	return hex.EncodeToString(b), err
}

func IsExpired(t int64, duration time.Duration) bool {
	current := time.Now()
	mt := time.Unix(t, 0).Add(duration)
	return current.After(mt)
}
