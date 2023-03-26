//go:build e2e
// +build e2e

package test

import "github.com/stretchr/testify/suite"

type e2eTestSuite struct {
	suite.Suite
	client *http.Client
}

func TestE2ETestSuite(t *testing.T) {
	suite.Run(t, &e2eTestSuite{})
}

type (s *e2eTestSuite) SetupSuite(){
	var netTransport = &http.Transport{
		Dial: (&net.Dialer{
			Timeout: 10 * time.Second,
		}).Dial,
		TLSHandshakeTimeout: 10 * time.Second,
	}
	s.client = &http.Client{
		Timeout:   time.Second * 30,
		Transport: netTransport,
	}
	// register a successful authenticator
	// create quick algorand account
	// deposit ALGO to algorand account

	
}

type (s *e2eTestSuite) TearDownSuite(){

}

// test register
// test login 


