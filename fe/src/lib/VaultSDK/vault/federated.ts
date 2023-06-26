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

export interface SessionInitResponse {
	id: string;
	app_name: string;
	origin: string;
	attributes: string[];
}

export interface EmailSessionResponse {
	token: string;
}

export interface ConsentResponse {
	app_id: string;
	app_name: string;
	required_attributes: string[];
	missing_attributes: string[];
	token: string;
	passes: ConsentPass[];
}

export interface ConsentPass {
	type: string;
	data: string;
}

export interface SaveConsentResponse {
	token: string;
	vcs?: string[];
}

export interface AuthResult {
	jwt: string;
}

export interface EmailValiationResponse {
	email: string;
	type: string;
}
export interface EmailSendResponse {
	session: string;
}

export class VaultFederated extends Base {
	async sessionInit(
		origin: string,
		api: string
	): Promise<SessionInitResponse> {
		return await utils.http.post(
			this._baseURL,
			"/api/federated/sessionInit",
			{ api: api, origin: origin }
		);
	}

	async sendEmailSession(
		session: string,
		email: string,
		type: string,
		origin: string
	): Promise<EmailSendResponse> {
		return await utils.http.post(
			this._baseURL,
			"/api/federated/sendEmailSession",
			{ email: email, session: session, type: type, origin: origin }
		);
	}

	async checkConsent(session: string): Promise<ConsentResponse> {
		return await utils.http.post(
			this._baseURL,
			"/api/federated/checkConsent",
			{ session: session }
		);
	}

	async saveConsent(session: string): Promise<SaveConsentResponse> {
		return await utils.http.post(
			this._baseURL,
			"/api/federated/saveConsent",
			{
				session: session,
			}
		);
	}

	async federated_validate_email(
		token: string
	): Promise<EmailValiationResponse> {
		return await utils.http.post(
			this._baseURL,
			"/api/federated/email/validation",
			{ token: token }
		);
	}

	/**
	 * Sign up a user for FIDO2 authentication.
	 * @returns {Promise<Result>}
	 * */
	async federated_register(
		username: string,
		token: string,
		sessionId: string
	): Promise<AuthResult> {
		const session = localStorage.getItem("register_session");

		// Init the registration flow
		const initPayload = <
			{
				username: string;
				device_name: string;
				register_session: string;
				options: {
					register_session?: string;
					roaming_authenticator?: boolean;
				};
			}
		>{
			username,
			register_session: session,
			options: {
				register_session: session,
			},
		};

		let initResponse = await utils.http.post(
			this._baseURL,
			"/api/federated/register/init",
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

		const deviceName = this.getDeviceNameFromAgent();
		// Complete the registration flow
		const completePayload = <
			{
				client_id: string;
				device_name: string;
				username: string;
				challenge: string;
				credential_uuid: string;
				credential_id: string;
				client_data: string;
				attestation_data: string;
				token: string;
				session_id: string;
				options?: {
					credential_name?: string;
				};
			}
		>{
			client_id: this._clientID,
			username: username,
			token: token,
			session_id: sessionId,
			device_name: deviceName,
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
			"/api/federated/register/complete",
			completePayload
		);
	}

	/**
	 * Authenticate a previously registered user through FIDO2.
	 * @returns {Promise<Result>}
	 * */
	async federated_authenticate(
		username: string,
		sessionId: string
	): Promise<AuthResult> {
		let headers;

		// Init the authentication flow
		let initPayload = <
			{
				username: string;
				session_id: string;
			}
		>{
			username,
			session_id: sessionId,
		};

		let initResponse = await utils.http.post(
			this._baseURL,
			"/api/federated/authenticate/init",
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
		const completePayload = <
			{
				username: string;
				challenge: string;
				credential_id: string;
				client_data: string;
				authenticator_data: string;
				signature: string;
				session_id: string;
			}
		>{
			username,
			challenge,
			session_id: sessionId,
			credential_id: utils.encoding.bufferToBase64(credential.rawId),
			client_data: utils.encoding.bufferToBase64(response.clientDataJSON),
			authenticator_data: utils.encoding.bufferToBase64(
				response.authenticatorData
			),
			signature: utils.encoding.bufferToBase64(response.signature),
		};

		return await utils.http.post(
			this._baseURL,
			"/api/federated/authenticate/complete",
			completePayload
		);
	}

	getDeviceNameFromAgent(): string {
		// device name
		var parser = new UAParser();
		parser.setUA(navigator.userAgent);
		var deviceInfo = parser.getResult();

		var deviceName = "";
		if (deviceInfo.device != null && deviceInfo.device.model != null) {
			if (deviceName.length > 0) {
				deviceName = deviceName + " ";
			}
			deviceName = deviceName + deviceInfo.device.model;
		}
		if (deviceInfo.os != null && deviceInfo.os.name != null) {
			if (deviceName.length > 0) {
				deviceName = deviceName + " ";
			}
			deviceName = deviceName + deviceInfo.os.name;
		}
		if (deviceName.length > 0) {
			deviceName = deviceName + " ";
		}
		deviceName = deviceName + deviceInfo.browser.name;
		return deviceName;
	}
}
