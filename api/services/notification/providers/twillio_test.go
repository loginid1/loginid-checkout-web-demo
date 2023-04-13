package notification

import (
	"testing"

	"github.com/stretchr/testify/require"
)

func TestInit(t *testing.T) {
	var provider ProviderInterface = &TwillioProvider{}
	require.Panics(t, func() { provider.Init() })

	t.Setenv("TWILIO_PHONE_NUMBER", "INVALID_PHONE_NUMBER")
	require.Panics(t, func() { provider.Init() })

	t.Setenv("TWILIO_PHONE_NUMBER", "+18449311011")
	require.NotPanics(t, func() { provider.Init() })
}

func TestGetProvider(t *testing.T) {
	var provider ProviderInterface = &TwillioProvider{}
	require.Equal(t, TwillioProviderType, provider.GetProvider())
}

func TestSend(t *testing.T) {
	var provider ProviderInterface = &TwillioProvider{}

	t.Setenv("TWILIO_ACCOUNT_SID", "AC50f001954625aaff8c217519e7fc4964")
	t.Setenv("TWILIO_AUTH_TOKEN", "e8708f91e7cfe6ca82a2daf4e6c62a5b")
	t.Setenv("TWILIO_PHONE_NUMBER", "+18449311011")

	provider.Init()
	err := provider.Send("+5541991613172", "Your vault OTP is: 123456")
	require.NoError(t, err)
}
