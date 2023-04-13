package notification

import (
	"fmt"

	"github.com/go-playground/validator/v10"
	twilio "github.com/twilio/twilio-go"
	openapi "github.com/twilio/twilio-go/rest/api/v2010"
	"gitlab.com/loginid/software/libraries/goutil.git"
)

type TwillioProvider struct {
	from string
}

func NewTwillioProvider() ProviderInterface {
	provider := &TwillioProvider{}
	provider.Init()

	return provider
}

func (p *TwillioProvider) Init() {
	p.from = goutil.GetEnv("TWILIO_PHONE_NUMBER", "")

	if p.from == "" {
		panic("[SMS Provider] missing the 'TWILIO_PHONE_NUMBER' environment variable")
	}

	V := validator.New()
	if err := V.Var(p.from, "e164"); err != nil {
		panic(fmt.Sprintf("[SMS Provider] %s", err.Error()))
	}
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

var _ ProviderInterface = &TwillioProvider{}
