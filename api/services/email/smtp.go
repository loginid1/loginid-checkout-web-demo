package email

import (
	"fmt"
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
		"Click here to confirm your email: %s/fe/api/email?token=%s\r\n", email, url, jwt))
	err := smtp.SendMail(fmt.Sprintf("%s:587", email_url), auth, "vault-no-reply@loginid.io", to, msg)
	if err != nil {
		logger.Global.Error(err.Error())
		return err
	}
	return nil
}
