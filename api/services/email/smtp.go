package email

import (
	"bytes"
	"html/template"

	"github.com/go-mail/mail"
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

func ComposeMsg(mailData Mail) *mail.Message {
	m := mail.NewMessage()

	m.SetHeader("From", mailData.Sender)
	m.SetHeader("To", mailData.To...)
	if len(mailData.CC) > 0 {
		m.SetHeader("Cc", mailData.CC...)
	}

	m.SetHeader("Subject", mailData.Subject)
	m.SetBody("text/plain", mailData.TextBody)
	m.AddAlternative("text/html", mailData.HtmlBody)

	return m
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
	dialer := mail.NewDialer(smtpUrl, smtpPort, smtpUser, smtpPassword)

	if err = dialer.DialAndSend(msg); err != nil {
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
	dialer := mail.NewDialer(smtpUrl, smtpPort, smtpUser, smtpPassword)

	if err = dialer.DialAndSend(msg); err != nil {
		logger.Global.Error(err.Error())
		return err
	}
	return nil
}
