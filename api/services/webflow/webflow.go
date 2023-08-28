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

type WebflowPagesResult struct {
	Pages []WebflowPage `json:"pages"`
}

type WebflowPage struct {
	ID       string `json:"id"`
	ParentID string `json:"parentId"`
	Title    string `json:"title"`
	Slug     string `json:"slug"`
	Path     string `json:"path"`
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

type WebflowButtonTemplate struct {
	WalletURL string
	AppID     string
}

type WebflowProtectedPagesTemplate struct {
	WalletApiURL   string
	AppID          string
	PublicKey      string
	ProtectedPages string
	LoginPage      string
}

type WebflowSettings struct {
	SiteID         string        `json:"site_id"`
	SiteName       string        `json:"site_name"`
	SiteShortName  string        `json:"site_shortname"`
	LoginPage      string        `json:"login_page"`
	ProjectedPages []WebflowPage `json:"protected_pages"`
}
