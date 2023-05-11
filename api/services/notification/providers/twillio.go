package notification

import (
	"errors"
	"fmt"

	"github.com/go-playground/validator/v10"
	twilio "github.com/twilio/twilio-go"
	openapi "github.com/twilio/twilio-go/rest/api/v2010"
	verify "github.com/twilio/twilio-go/rest/verify/v2"
	"gitlab.com/loginid/software/libraries/goutil.git"
)

type TwillioProvider struct {
	from      string
	client    *twilio.RestClient
	serviceId string
}

func NewTwillioProvider() ProviderInterface {
	provider := &TwillioProvider{}
	provider.Init()

	return provider
}

func (p *TwillioProvider) Init() {
	p.from = goutil.GetEnv("TWILIO_PHONE_NUMBER", "")
	p.serviceId = goutil.GetEnv("TWILIO_SERVICE_ID", "")
	if p.from == "" {
		panic("[SMS Provider] missing the 'TWILIO_PHONE_NUMBER' environment variable")
	}

	V := validator.New()
	if err := V.Var(p.from, "e164"); err != nil {
		panic(fmt.Sprintf("[SMS Provider] %s", err.Error()))
	}
	p.client = twilio.NewRestClient()

}

func (p *TwillioProvider) GetProvider() ProviderType {
	return TwillioProviderType
}

func (p *TwillioProvider) Send(to, message string) error {
	client := twilio.NewRestClient()

	params := &openapi.CreateMessageParams{}
	params.SetTo(to)
	params.SetFrom(p.from)
	params.SetBody(message)

	_, err := client.Api.CreateMessage(params)
	if err != nil {
		return err
	}

	return nil
}

func (p *TwillioProvider) SendCode(to string) (string, error) {
	params := &verify.CreateVerificationParams{}
	params.SetTo(to)
	params.SetChannel("sms")

	resp, err := p.client.VerifyV2.CreateVerification(p.serviceId, params)
	if err != nil {
		fmt.Println(err.Error())
		return "", err
	} else {
		if resp.Sid != nil {
			return *resp.Sid, nil
		} else {
			return "", errors.New("no sid")
		}
	}
}

func (p *TwillioProvider) VerifyCode(sid string, code string) (bool, error) {
	params := &verify.CreateVerificationCheckParams{}
	//params.SetTo(to)
	params.SetCode(code)
	params.SetVerificationSid(sid)
	//params.SetCustomCode("123456")

	resp, err := p.client.VerifyV2.CreateVerificationCheck(p.serviceId, params)
	if err != nil {
		fmt.Println(err.Error())
		return false, err
	} else {
		return *resp.Valid, nil
	}
}

var _ ProviderInterface = &TwillioProvider{}
