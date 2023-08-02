import {
	AuthorizationNotifier,
	AuthorizationRequestHandler,
	TokenRequestHandler,
	AuthorizationServiceConfiguration,
	AuthorizationRequest,
	AuthorizationResponse,
	TokenResponse,
	RedirectRequestHandler,
	BaseTokenRequestHandler,
	log,
	TokenRequest,
	StringMap,
	GRANT_TYPE_AUTHORIZATION_CODE,
	GRANT_TYPE_REFRESH_TOKEN,
	FetchRequestor,
	AuthorizationServiceConfigurationJson,
} from "@openid/appauth";

/* an example open id connect provider */
//const openIdConnectUrl = "https://6fb2-45-72-195-110.ngrok-free.app";
const openIdConnectUrl = process.env.REACT_APP_OIDC_URL || "https://6fb2-45-72-195-110.ngrok-free.app";

/* example client configuration */
const clientId = process.env.REACT_APP_LICENSE_APP_API || "";
//const redirectUri = "https://91ff-45-72-195-110.ngrok-free.app/callback";
const redirectUri = process.env.REACT_APP_OIDC_CALLBACK || "https://91ff-45-72-195-110.ngrok-free.app/callback";
const scope = "openid";

/**
 * The Test application.
 */
export class OidcService {
	private notifier: AuthorizationNotifier;
	private authorizationHandler: AuthorizationRequestHandler;
	private tokenHandler: TokenRequestHandler;

	// state
	private configuration: AuthorizationServiceConfiguration | undefined;
	private request: AuthorizationRequest | undefined;
	private response: AuthorizationResponse | undefined;
	private code: string | undefined;
	private tokenResponse: TokenResponse | undefined;

	constructor() {
		const requestor = new FetchRequestor();
		this.notifier = new AuthorizationNotifier();
		this.authorizationHandler = new RedirectRequestHandler();
		this.tokenHandler = new BaseTokenRequestHandler(requestor);
		// set notifier to deliver responses
		this.authorizationHandler.setAuthorizationNotifier(this.notifier);
		// set a listener to listen for authorization responses
		this.notifier.setAuthorizationListener((request, response, error) => {
			log("Authorization request complete ", request, response, error);
			if (response) {
				this.request = request;
				this.response = response;
				this.code = response.code;

				this.showMessage(`Authorization Code ${response.code}`);
			}
		});
		const request = <AuthorizationServiceConfigurationJson>{
			authorization_endpoint: openIdConnectUrl + "/oidc/auth",
			token_endpoint: openIdConnectUrl + "/oidc/token",
		};

		this.configuration = new AuthorizationServiceConfiguration(request);
	}

	showMessage(message: string) {
		log(message);
	}

	fetchServiceConfiguration() {
		const requestor = new FetchRequestor();
		AuthorizationServiceConfiguration.fetchFromIssuer(
			openIdConnectUrl,
			new FetchRequestor()
		)
			.then((response) => {
				log("Fetched service configuration", response);
				this.configuration = response;
				this.showMessage("Completed fetching configuration");
			})
			.catch((error) => {
				log("Something bad happened", error);
				this.showMessage(`Something bad happened ${error}`);
			});
	}

	makeAuthorizationRequest() {
		// create a request
		let request = new AuthorizationRequest({
			client_id: clientId,
			redirect_uri: redirectUri,
			scope: scope,
			response_type: AuthorizationRequest.RESPONSE_TYPE_CODE,
			state: undefined,
			extras: { prompt: "consent", access_type: "offline" },
		});

		if (this.configuration) {
			this.authorizationHandler.performAuthorizationRequest(
				this.configuration,
				request
			);
		} else {
			this.showMessage(
				"Fetch Authorization Service configuration, before you make the authorization request."
			);
		}
	}

	async makeTokenRequest(): Promise<boolean> {
		await this.authorizationHandler.completeAuthorizationRequestIfPossible();

		// this.code = code;
		if (!this.configuration) {
			this.showMessage("Please fetch service configuration.");
			return Promise.reject("please fetch service configuration");
		}
		//console.log("token : ", this.request.internal);

		const requestor = new FetchRequestor();
		let request: TokenRequest | null = null;
		if (this.code) {
			let extras: StringMap | undefined = undefined;
			if (this.request && this.request.internal) {
				extras = {};
				extras["code_verifier"] =
					this.request.internal["code_verifier"];
			}
			// use the code to make the token request.
			request = new TokenRequest({
				client_id: clientId,
				redirect_uri: redirectUri,
				grant_type: GRANT_TYPE_AUTHORIZATION_CODE,
				code: this.code,
				refresh_token: undefined,
				extras: extras,
			});
		} else if (this.tokenResponse) {
			// use the token response to make a request for an access token
			request = new TokenRequest({
				client_id: clientId,
				redirect_uri: redirectUri,
				grant_type: GRANT_TYPE_REFRESH_TOKEN,
				code: undefined,
				refresh_token: this.tokenResponse.refreshToken,
				extras: undefined,
			});
		}

		if (request) {
			try {
				let response = await this.tokenHandler.performTokenRequest(
					this.configuration,
					request
				);
				let isFirstRequest = false;
				if (this.tokenResponse) {
					// copy over new fields
					this.tokenResponse.accessToken = response.accessToken;
					this.tokenResponse.issuedAt = response.issuedAt;
					this.tokenResponse.expiresIn = response.expiresIn;
					this.tokenResponse.tokenType = response.tokenType;
					this.tokenResponse.scope = response.scope;
				} else {
					isFirstRequest = true;
					this.tokenResponse = response;
				}

				// unset code, so we can do refresh token exchanges subsequently
				this.code = undefined;
				if (isFirstRequest) {
					this.showMessage(
						`Obtained a refresh token ${response.refreshToken}`
					);
				} else {
					this.showMessage(
						`Obtained an access token ${response.accessToken}.`
					);
				}
				return Promise.resolve(true);
			} catch (error) {
				log("Something bad happened", error);
				this.showMessage(`Something bad happened ${error}`);
				return Promise.reject("failed request");
			}
		} else {
			return Promise.reject("failed request");
		}
	}

	checkForAuthorizationResponse() {
		this.authorizationHandler.completeAuthorizationRequestIfPossible();
	}
}

const oidcService = new OidcService();
export default oidcService;
