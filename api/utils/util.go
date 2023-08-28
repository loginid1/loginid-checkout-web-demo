package utils

import (
	"bytes"
	"crypto/rand"
	"encoding/base64"
	"encoding/hex"
	"fmt"
	"regexp"
	"strings"
	"text/template"
	"time"

	qrcode "github.com/skip2/go-qrcode"
)

// email validation regular expression
// https://www.w3.org/TR/2016/REC-html51-20161101/sec-forms.html#valid-e-mail-address
var emailRegex = regexp.MustCompile("^[a-zA-Z0-9.!#$%&'*+\\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$")

// IsEmailValid checks if the email provided passes the required structure
// and length test.
// https://www.w3.org/TR/2016/REC-html51-20161101/sec-forms.html#valid-e-mail-address
func IsEmailValid(e string) bool {
	if len(e) < 3 || len(e) > 256 {
		return false
	}

	return emailRegex.MatchString(e)
}

func Contains[T comparable](s []T, e T) bool {
	for _, v := range s {
		if v == e {
			return true
		}
	}
	return false
}

func Remove[T comparable](l []T, item T) []T {
	for i, other := range l {
		if other == item {
			return append(l[:i], l[i+1:]...)
		}
	}
	return l
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

func GenerateQRCode(url string) (string, error) {
	var png []byte
	png, err := qrcode.Encode(url, qrcode.Medium, 256)
	if err != nil {
		return "", err
	}
	return fmt.Sprintf("data:image/png;base64,%s", base64.RawStdEncoding.EncodeToString(png)), nil
}

func MaskData(data string, startLen, finishLen int) (string, error) {
	length := len(data)

	// sanity check; data must be validated before calling this function
	if length < startLen+finishLen {
		return "", fmt.Errorf("phone number is too short")
	}

	return data[:startLen] + strings.Repeat("*", length-startLen+finishLen) + data[length-finishLen:], nil
}

func MaskEmailAddress(email string) (string, error) {
	// sanity check; email must be validated before calling this function
	if len(email) < 3 {
		return "", fmt.Errorf("email is too short")
	}

	// Mask user email as credential name
	emailSplit := strings.Split(email, "@")
	emailLength := len(emailSplit[0])
	maskedEmail := strings.Repeat("*", emailLength) + "@" + emailSplit[1]

	if emailLength > 2 {
		maskedEmail = emailSplit[0][:1] + strings.Repeat("*", emailLength-2) + emailSplit[0][emailLength-1:] + "@" + emailSplit[1]
	}

	return maskedEmail, nil
}

func ParseTemplate(templatePath string, templateFileName string, data interface{}) (string, error) {
	t, err := template.ParseFiles(fmt.Sprintf("%s/%s", templatePath, templateFileName))
	if err != nil {
		return "", err
	}
	buf := new(bytes.Buffer)
	if err = t.Execute(buf, data); err != nil {
		return "", err
	}
	return buf.String(), nil
}
