import utils from "./utils"

export interface Result {
    client: {
        id: string;
        type: string;
    }
    user: {
        id: string;
        type: string;
        username: string;
        namespace_id: string;
    }
    credential: {
        uuid: string;
        name: string;
        type: string;
    }
    jwt: string;
}

export interface PushAuthenticationOptions {
    transient_email: string;
}

export interface AddAuthenticatorOptions {
    transient_email: string;
}

type CallbackFunction = (code: string, devices: [], notification: any, expireAt: number) => void;

export class Base {
    protected readonly _baseURL: string
    protected readonly _clientID: string

    constructor(baseURL: string, clientID: string) {
        this._baseURL = baseURL;
        this._clientID = clientID;
    }

    /**
     * @deprecated This method is deprecated, please refer to the documentation on how to allow temporary authentication
     * */
     async pushAuthentication(username: string, callback: CallbackFunction, options: PushAuthenticationOptions | null = null) {
        const initPayload = {
            client_id: this._clientID,
            username,
            options,
        };

        let response = await utils.http.post(
            this._baseURL,
            "/push_authentication/init",
            initPayload,
        );

        const { code, devices, notification, expire_at } = response;
        callback(code, devices, notification, expire_at);

        const completePayload = {
            ...initPayload,
            options: {
                ...options,
                remote_session: { code }
            }
        };

        return await utils.http.post(
            this._baseURL,
            "/push_authentication/complete",
            completePayload,
        );
    }

    /**
     * @deprecated This method is deprecated, please refer to the documentation on how to add credentials
     * */
    async addAuthenticator(username: string, callback: CallbackFunction, options: AddAuthenticatorOptions | null = null) {
        let initPayload = {
            client_id: this._clientID,
            username,
            options,
        };

        let initResponse = await utils.http.post(
            this._baseURL,
            "/add_authenticator/init",
            initPayload,
        );

        const { code, devices, notification, expire_at } = initResponse;
        callback(code, devices, notification, expire_at);

        const completePayload = {
            ...initPayload,
            options: {
                ...options,
                remote_session: { code }
            }
        };

        const completeResponse = await utils.http.post(
            this._baseURL,
            "/add_authenticator/complete",
            completePayload,
        );

        const initAddPayload = {
            ...initPayload,
            options: {
                remote_session: { session_id: completeResponse.registration_session }
            }
        };

        const registerInitResponse = await utils.http.post(
            this._baseURL,
            "/add_authenticator/init",
            initAddPayload,
        );

        const { uid, session_id: sId, ...publicKey } = registerInitResponse;
        localStorage.setItem("register_session_id", sId);

        const { challenge } = publicKey;
        publicKey.challenge = utils.encoding.base64ToBuffer(publicKey.challenge);
        publicKey.user.id = utils.encoding.base64ToBuffer(publicKey.user.id);

        const credential = await utils.navigator.createCredential({ publicKey });

        const response = <AuthenticatorAttestationResponse>credential.response
        const completeAddPayload = {
            ...initAddPayload,
            payload: {
                challenge,
                id: utils.encoding.bufferToBase64(credential.rawId),
                raw_id: utils.encoding.bufferToBase64(credential.rawId),
                credential_id: uid,
                client_data: utils.encoding.bufferToBase64(response.clientDataJSON),
                attestation_data: utils.encoding.bufferToBase64(response.attestationObject),
            }
        };

        return await utils.http.post(
            this._baseURL,
            "/add_authenticator/complete",
            completeAddPayload,
        );
    }
}

export default Base;
