package services

type EccJWK struct {
	Crv string `json:"crv"`
	X   string `json:"x"`
	Y   string `json:"y"`
}
