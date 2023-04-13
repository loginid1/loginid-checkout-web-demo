package notification

type ProviderType string

const (
	TwillioProviderType ProviderType = "twillio"
)

type ProviderInterface interface {
	Init()
	GetProvider() ProviderType
	Send(to, message string) error
}
