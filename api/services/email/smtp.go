package email

import (
	"bytes"
	"fmt"
	"html/template"
	"net/smtp"

	"gitlab.com/loginid/software/libraries/goutil.git"
	"gitlab.com/loginid/software/libraries/goutil.git/logger"
)

func SendCode(email string, code string) {

	username := goutil.GetEnv("SMTP_USER", "")
	password := goutil.GetEnv("SMTP_PASSWORD", "")
	url := goutil.GetEnv("SMTP_URL", "")
	// Set up authentication information.
	auth := smtp.PlainAuth("", username, password, url)

	// Connect to the server, authenticate, set the sender and recipient,
	// and send the email all in one step.
	to := []string{email}
	msg := []byte(fmt.Sprintf("To: %s\r\n"+
		"Subject: Login Code!\r\n"+
		"\r\n"+
		"Your login code is: %s.\r\n", email, code))
	err := smtp.SendMail(fmt.Sprintf("%s:587", url), auth, "vault-no-reply@loginid.io", to, msg)
	if err != nil {
		logger.Global.Error(err.Error())
	}
}

func SendEmailValidation(email string, url string, jwt string) error {

	username := goutil.GetEnv("SMTP_USER", "")
	password := goutil.GetEnv("SMTP_PASSWORD", "")
	email_url := goutil.GetEnv("SMTP_URL", "")
	// Set up authentication information.
	auth := smtp.PlainAuth("", username, password, email_url)

	// Connect to the server, authenticate, set the sender and recipient,
	// and send the email all in one step.
	to := []string{email}
	msg := []byte(fmt.Sprintf("To: %s\r\n"+
		"Subject: Email confirmation !\r\n"+
		"\r\n"+
		"Click here to confirm your email: %s/sdk/email?token=%s\r\n", email, url, jwt))
	err := smtp.SendMail(fmt.Sprintf("%s:587", email_url), auth, "vault-no-reply@loginid.io", to, msg)
	if err != nil {
		logger.Global.Error(err.Error())
		return err
	}
	return nil
}

func SendHtmlEmailValidation(email string, request_type string, url string, origin string, jwt string) error {

	username := goutil.GetEnv("SMTP_USER", "")
	password := goutil.GetEnv("SMTP_PASSWORD", "")
	email_url := goutil.GetEnv("SMTP_URL", "")
	// Set up authentication information.
	auth := smtp.PlainAuth("", username, password, email_url)

	data := struct {
		Origin string
		Url    string
	}{
		Origin: origin,
		Url:    fmt.Sprintf("%s/sdk/email?token=%s", url, jwt),
	}

	mime := "MIME-version: 1.0;\nContent-Type: text/html; charset=\"UTF-8\";\n\n"
	filepath := "signup.template.html"
	if request_type == "login" {
		filepath = "login.template.html"
	}
	body, err := ParseTemplate(filepath, data)
	if err != nil {
		logger.Global.Error(err.Error())
		return err
	}
	// Connect to the server, authenticate, set the sender and recipient,
	// and send the email all in one step.
	to := []string{email}
	msg := []byte(fmt.Sprintf("Subject: Email confirmation !\n"+
		"%s\n%s", mime, body))
	err = smtp.SendMail(fmt.Sprintf("%s:587", email_url), auth, "vault-no-reply@loginid.io", to, msg)
	if err != nil {
		logger.Global.Error(err.Error())
		return err
	}
	return nil
}

const template_path = "services/email/templates/"

func ParseTemplate(templateFileName string, data interface{}) (string, error) {
	t, err := template.ParseFiles(template_path + templateFileName)
	if err != nil {
		return "", err
	}
	buf := new(bytes.Buffer)
	if err = t.Execute(buf, data); err != nil {
		return "", err
	}
	return buf.String(), nil
}
