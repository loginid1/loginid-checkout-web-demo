import Base from "../base"
import utils from "../utils";

export interface TransactionOptions {
    authorization_token?: string;
    nonce?: string;
}

export class TransactionConfirmation extends Base {
    async createAndConfirmTransaction(username: string, tx_payload: string, options: TransactionOptions) {
        let headers;
        if (options && options.authorization_token) {
            headers = { Authorization: `Bearer ${options.authorization_token}` };
            delete options.authorization_token;
        }

        const response = await utils.http.post(
            this._baseURL,
            '/api/tx',
            {
                client_id: this._clientID,
                tx_payload,
                ...(options && {nonce: options.nonce})
            },
            headers
        );
        return await this.confirmTransaction(username, response.id);
    }

    async confirmTransaction(username:string, tx_id: string) {
        const initResponse = await utils.http.post(
            this._baseURL,
            '/api/tx/init',
            {
                client_id: this._clientID,
                username,
                tx_id,
                tx_type: "text"
            }
        );

        const publicKey = initResponse.assertion_options;
        const { challenge } = publicKey;
        publicKey.challenge = utils.encoding.base64ToBuffer(publicKey.challenge);
        if (publicKey.allowCredentials) {
            for (const credential of publicKey.allowCredentials) {
                credential.id = utils.encoding.base64ToBuffer(credential.id);
            }
        }

        const credential = await utils.navigator.getCredential({ publicKey });
        const completeResponse = <AuthenticatorAssertionResponse>credential.response
        const assertionPayload = {
            username,
            tx_id,
            client_id: this._clientID,
            challenge: challenge,
            key_handle: utils.encoding.bufferToBase64(credential.rawId),
            client_data: utils.encoding.bufferToBase64(completeResponse.clientDataJSON),
            auth_data: utils.encoding.bufferToBase64(completeResponse.authenticatorData),
            sign_data: utils.encoding.bufferToBase64(completeResponse.signature),
        };

        return await utils.http.post(
            this._baseURL,
            "/api/tx/complete",
            assertionPayload
        );
    }
}

export default TransactionConfirmation;
