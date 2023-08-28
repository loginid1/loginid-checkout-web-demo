const PUBLIC_KEY = {{.PublicKey}};

const API_URL = '{{.WalletApiURL}}';
const PROTECTED_PAGES =  {{.ProtectedPages}};
const LOGIN_PAGE = '{{.LoginPage}}';

loginid.WebflowSDK.checkAuthorizePage(API_URL, PUBLIC_KEY, PROTECTED_PAGES, LOGIN_PAGE);
