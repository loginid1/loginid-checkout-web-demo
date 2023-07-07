import Base, { Result } from "../base";
import utils from "../utils";
import { UAParser } from "ua-parser-js";
import { SDKError } from "../utils/errors";

/**
 * Extra options used for the add credential function.
 * @property credential_name
 * @property code_type
 * */
export interface AddCredentialOptions extends RegistrationOptions {
	code_type?: string;
	roaming_authenticator?: boolean;
}

interface UserAgentInfo { 
	name: string;
	device: string;
	os: string;
	browser: string; 
}

export class VaultAuth extends Base {
	async checkUser(username: string): Promise<boolean> {
		try {
			await utils.http.post(this._baseURL, "/api/federated/checkuser", {
				username: username,
			});
			console.log("user found");
			return true;
		} catch (err) {
			return false;
		}
	}

	async sendCode(username: string): Promise<boolean> {
		try {
			await utils.http.post(this._baseURL, "/api/federated/sendcode", {
				email: username,
			});
			return true;
		} catch (err) {
			return false;
		}
	}

	/**
	 * Sign up a user for FIDO2 authentication.
	 * @returns {Promise<Result>}
	 * */
	async register(
		username: string,
		scope: string,
		sessionId: string,
		token: string
	): Promise<Result> {
		const session = localStorage.getItem("register_session");

		// Init the registration flow
		const initPayload = {
			username,
			register_session: session,
			options: {
				register_session: session,
			},
		};

		let initResponse = await utils.http.post(
			this._baseURL,
			"/api/register/init",
			initPayload
		);

		// Process the register init response and request the credential creation from the browser
		const {
			register_session: registerSession,
			attestation_payload: attestationPayload,
		} = initResponse;

		const { credential_uuid: credentialUUID, ...publicKey } =
			attestationPayload;
		localStorage.setItem("register_session", registerSession);

		const { challenge } = publicKey;
		publicKey.challenge = utils.encoding.base64ToBuffer(
			publicKey.challenge
		);
		publicKey.user.id = utils.encoding.base64ToBuffer(publicKey.user.id);
		if (publicKey.excludeCredentials) {
			publicKey.excludeCredentials = publicKey.excludeCredentials.map(
				utils.navigator.convertCredentialDescriptor
			);
		}

		const credential = await utils.navigator.createCredential({
			publicKey,
		});
		const response = <AuthenticatorAttestationResponse>credential.response;

		const userAgentInfo = this.getUserAgentInfo();
		// Complete the registration flow
		const completePayload = {
			client_id: this._clientID,
			username: username,
			device_name: userAgentInfo.name,
			user_agent: {
				operating_system: userAgentInfo.os,
				device: userAgentInfo.device,
				browser: userAgentInfo.browser,
			},
			challenge: challenge,
			credential_uuid: credentialUUID,
			credential_id: utils.encoding.bufferToBase64(credential.rawId),
			client_data: utils.encoding.bufferToBase64(response.clientDataJSON),
			attestation_data: utils.encoding.bufferToBase64(
				response.attestationObject
			),
            scope: scope,
            email_token: token,
            session_id: sessionId,
		};

		// TODO: Check for backward compatibility
		return await utils.http.post(
			this._baseURL,
			"/api/register/complete",
			completePayload
		);
	}

	/**
	 * Authenticate a previously registered user through FIDO2.
	 * @returns {Promise<Result>}
	 * */
	async authenticate(username: string): Promise<Result> {
		let headers;

		// Init the authentication flow
		let initPayload = {
			username,
		};

		let initResponse = await utils.http.post(
			this._baseURL,
			"/api/authenticate/init",
			initPayload,
			headers
		);

		// Process the authenticate init response and request the credential from the browser
		const { assertion_payload: assertionPayload } = initResponse;

		const { challenge } = assertionPayload;
		assertionPayload.challenge = utils.encoding.base64ToBuffer(
			assertionPayload.challenge
		);
		if (assertionPayload.allowCredentials) {
			for (const credential of assertionPayload.allowCredentials) {
				credential.id = utils.encoding.base64ToBuffer(credential.id);
			}
		}

		const credential = await utils.navigator.getCredential({
			publicKey: assertionPayload,
		});
		const response = <AuthenticatorAssertionResponse>credential.response;

		// Complete the authentication flow
		const completePayload = {
			username,
			challenge,
			credential_id: utils.encoding.bufferToBase64(credential.rawId),
			client_data: utils.encoding.bufferToBase64(response.clientDataJSON),
			authenticator_data: utils.encoding.bufferToBase64(
				response.authenticatorData
			),
			signature: utils.encoding.bufferToBase64(response.signature),
		};

		return await utils.http.post(
			this._baseURL,
			"/api/authenticate/complete",
			completePayload
		);
	}

	/**
	 * Sign up a user for FIDO2 authentication.
	 * @returns {Promise<Result>}
	 * */
	async addCredential(username: string, code: string): Promise<Result> {
		// Init the registration flow
		const initPayload: { username: string; code: string; } = {
			username,
			code,
		};

		let initResponse = await utils.http.post(
			this._baseURL,
			"/api/addCredential/init",
			initPayload
		);

		// Process the register init response and request the credential creation from the browser
		const { attestation_payload: attestationPayload } = initResponse;

		const { credential_uuid: credentialUUID, ...publicKey } =
			attestationPayload;

		const { challenge } = publicKey;
		publicKey.challenge = utils.encoding.base64ToBuffer(
			publicKey.challenge
		);
		publicKey.user.id = utils.encoding.base64ToBuffer(publicKey.user.id);
		if (publicKey.excludeCredentials) {
			publicKey.excludeCredentials = publicKey.excludeCredentials.map(
				utils.navigator.convertCredentialDescriptor
			);
		}

		console.log("Before...")
		const credential = await utils.navigator.createCredential({
			publicKey,
		});

		console.log(credential)
		const response = <AuthenticatorAttestationResponse>credential.response;

		const userAgentInfo = this.getUserAgentInfo();
		// Complete the registration flow
		const completePayload = {
			client_id: this._clientID,
			username: username,
			device_name: userAgentInfo.name,
			user_agent: {
				operating_system: userAgentInfo.os,
				device: userAgentInfo.device,
				browser: userAgentInfo.browser,
			},
			challenge: challenge,
			credential_uuid: credentialUUID,
			credential_id: utils.encoding.bufferToBase64(credential.rawId),
			client_data: utils.encoding.bufferToBase64(response.clientDataJSON),
			attestation_data: utils.encoding.bufferToBase64(
				response.attestationObject
			),
		};

		// TODO: Check for backward compatibility
		return await utils.http.post(
			this._baseURL,
			"/api/addCredential/complete",
			completePayload
		);
	}

	getUserAgentInfo(): UserAgentInfo {
		const parser = new UAParser();
		parser.setUA(navigator.userAgent);
		const result = parser.getResult();

		let response: UserAgentInfo = {
			name: "", os: "", browser: "", device: ""
		}

		if (result.device != null && result.device.model != null) {
			response = {...response, device: result.device.model}
		}

		if (result.os != null && result.os.name != null) {
			response = {...response, os: result.os.name}
		}

		if (result.browser != null && result.browser.name != null) {
			response = {...response, browser: result.browser.name}
		}

		if (response.os !== "" && response.browser !== "") {
			response = {...response, name: `${response.os} Passkey [${response.browser}]`}
		} else {
			response = {...response, name: "Passkey"}
		}
		
		return response;
	}
}

export default VaultAuth;
