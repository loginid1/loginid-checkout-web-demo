package email

import (
	"bytes"
	"fmt"
	"html/template"
	"net/smtp"
	"strings"

	"gitlab.com/loginid/software/libraries/goutil.git"
	"gitlab.com/loginid/software/libraries/goutil.git/logger"
)

//const sender = `"LoginID Wallet" <no-reply@loginid.io>`
const sender = `no-reply@loginid.io`

var (
	smtpUser     = goutil.GetEnv("SMTP_USER", "")
	smtpPassword = goutil.GetEnv("SMTP_PASSWORD", "")
	smtpUrl      = goutil.GetEnv("SMTP_URL", "")
	smtpPort     = goutil.GetEnvInt("SMTP_PORT", 587)
)

type Mail struct {
	Sender   string
	To       []string
	CC       []string
	Bcc      []string
	Subject  string
	TextBody string
	HtmlBody string
}

func ComposeMsg(mail Mail) string {
	// empty string
	msg := ""
	// set sender
	msg += fmt.Sprintf("From: %s\r\n", mail.Sender)
	// set to
	msg += fmt.Sprintf("To: %s\r\n", strings.Join(mail.To, ","))
	// if more than 1 recipient
	if len(mail.CC) > 0 {
		msg += fmt.Sprintf("Cc: %s\r\n", strings.Join(mail.CC, ";"))
	}
	// add subject
	msg += fmt.Sprintf("Subject: %s\r\n", mail.Subject)
	/*
		msg += "Content-Type: multipart/alternative; boundary=\"boundary-string\"\r\n\r\n"
		msg += "--boundary-string\r\n" // set content type
		msg += "Content-Type: text/plain; charset=\"utf-8\"\r\n"
		msg += "Content-Transfer-Encoding: quoted-printable\r\n"
		msg += "Content-Disposition: inline\r\n\r\n"
		msg += fmt.Sprintf("%s\r\n\r\n", mail.TextBody)
		msg += "--boundary-string\r\n"
	*/
	// set content type
	msg += "Content-Type: text/html; charset=\"UTF-8\"\r\n"
	msg += "Content-Transfer-Encoding: quoted-printable\r\n"
	msg += "Content-Disposition: inline\r\n\r\n"
	// add mail body
	msg += fmt.Sprintf("%s\r\n\r\n", mail.HtmlBody)
	//msg += "--boundary-string--\r\n"
	return msg
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

type VerificationMail struct {
	Origin  string
	Url     string
	Session string
}

func SendValidationEmail(email string, data VerificationMail) error {
	to := []string{
		email,
	}

	subject := "Email Verification"
	htmlBody, err := ParseTemplate("verification.template.html", data)
	if err != nil {
		logger.Global.Error(err.Error())
		return err
	}

	textBody, err := ParseTemplate("verification.template.tmpl", data)
	if err != nil {
		logger.Global.Error(err.Error())
		return err
	}

	req := Mail{
		Sender:   sender,
		To:       to,
		CC:       []string{},
		Subject:  subject,
		TextBody: textBody,
		HtmlBody: htmlBody,
	}

	msg := ComposeMsg(req)
	auth := smtp.PlainAuth("", smtpUser, smtpPassword, smtpUrl)

	err = smtp.SendMail(fmt.Sprintf("%s:%d", smtpUrl, smtpPort), auth, sender, to, []byte(msg))
	if err != nil {
		logger.Global.Error(err.Error())
		return err
	}
	return nil
}

type SignupMail struct {
	Url string
}

func SendSignupEmail(email string, data SignupMail) error {
	to := []string{
		email,
	}

	subject := "Congratulations! You have a new Wallet Account"
	htmlBody, err := ParseTemplate("signup.template.html", data)
	if err != nil {
		logger.Global.Error(err.Error())
		return err
	}

	textBody, err := ParseTemplate("signup.template.tmpl", data)
	if err != nil {
		logger.Global.Error(err.Error())
		return err
	}

	req := Mail{
		Sender:   sender,
		To:       to,
		CC:       []string{},
		Subject:  subject,
		TextBody: textBody,
		HtmlBody: htmlBody,
	}

	msg := ComposeMsg(req)
	auth := smtp.PlainAuth("", smtpUser, smtpPassword, smtpUrl)

	err = smtp.SendMail(fmt.Sprintf("%s:%d", smtpUrl, smtpPort), auth, sender, to, []byte(msg))
	if err != nil {
		logger.Global.Error(err.Error())
		return err
	}
	return nil
}
