package webflow

type WebflowSitesResult struct {
	Sites []WebflowSite `json:"sites"`
}

type WebflowSite struct {
	ID            string          `json:"id"`
	DisplayName   string          `json:"displayName"`
	ShortName     string          `json:"shortName"`
	CustomDomains []WebflowDomain `json:"customDomains"`
}

type WebflowDomain struct {
	ID  string `json:"id"`
	Url string `json:"url"`
}

type WebflowRegisteredScriptsResult struct {
	RegisteredScripts []WebflowRegisteredScript `json:"registeredScripts"`
}

type WebflowRegisteredScript struct {
	ID          string `json:"id"`
	Version     string `json:"version"`
	DisplayName string `json:"displayName"`
}

type WebflowAddScriptsRequest struct {
	Scripts []WebflowAddScript `json:"scripts"`
}

type WebflowAddScript struct {
	ID       string `json:"id"`
	Version  string `json:"version"`
	Location string `json:"location"`
}

type WebflowAddScriptsResult struct {
	Scripts []WebflowAddScript `json:"scripts"`
}
