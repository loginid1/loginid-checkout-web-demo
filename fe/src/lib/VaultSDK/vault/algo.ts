import { WalletTransaction } from "../../common/api";
import Base from "../base";
import utils from "../utils";

export interface AccountList {
    accounts : Account []
}

export interface Account {
    id: string;
    address: string;
    iat: string;
    status: string;
    credentials_name: string[];
    recovery_address: string;
    teal_script: string;
}

export interface ContractAccount {
    address: string;
    teal_script: string;
    compile_script: string;
}

export interface AlgoAccountCreationRequest {
    verify_address: string;
    cred_id_list: string [];
    recovery: string;
}

export interface EnableRequest {
    address_list: string [];
    origin: string;
    network: string;
}
export interface Genesis {
    id: string;
    hash: string;
}

export interface TxnValidationRequest {
    transactions: WalletTransaction[];
    origin: string;
}

export interface TxnValidationResponse {
    txn_data: string [];
    txn_type: string [];
    required: boolean [];
    username: string;
}

export interface SignedTxn {
    txn: string;
}

export interface PaymentTransaction {
    from: string; 
    to: string;
    fee: number;
    amount: number;
    note: string;
    raw_data: string;
    sign_payload: string; // txnID
    sign_nonce: string; // generated nonce
}

export class VaultAlgo extends Base{

    async getAccountList(token: string) : Promise<AccountList> {
        const header = { "x-session-token": token };
        return await utils.http.get(
            this._baseURL,
            "/api/protected/algo/getAccountList",
            undefined,
            header
        );
    }

    async createAccount(token: string, request: AlgoAccountCreationRequest) : Promise<any> {
        const header = { "x-session-token": token };
        return await utils.http.post(
            this._baseURL,
            "/api/protected/algo/createAccount",
            request,
            header
        );
    }

    async generateScript(token: string, credentials: string[], recovery: string) : Promise<ContractAccount> {
        const header = { "x-session-token": token };
        return await utils.http.post(
            this._baseURL,
            "/api/protected/algo/generateScript",
            {credential_list: credentials, recovery: recovery},
            header
        );
    }

    async enable(token: string, address_list: string[], origin: string, network: string) : Promise<Genesis> {
        const header = { "x-session-token": token };
        return await utils.http.post(
            this._baseURL,
            "/api/wallet/enable",
            {address_list: address_list, origin: origin, network: network},
            header
        );
    }


    async txnValidation(transactions: WalletTransaction[],  origin: string) : Promise<TxnValidationResponse> {
        //const header = { "x-session-token": token };
        return await utils.http.post(
            this._baseURL,
            "/api/wallet/txValidation",
            {transactions: transactions, origin: origin },
        );
    }

    async txnConfirmation(username: string, payload: string, nonce: string) : Promise<SignedTxn> {

        let headers;

        // Init the authentication flow
        let initPayload = <{
            username: string;
        }> {
            username,
        };


        let initResponse = await utils.http.post(
            this._baseURL,
            "/api/authenticate/init",
            initPayload,
            headers
        );

        // Process the authenticate init response and request the credential from the browser
        const {
            assertion_payload: assertionPayload
          } = initResponse;

        const { challenge } = assertionPayload;
        assertionPayload.challenge = utils.encoding.base64ToBuffer(assertionPayload.challenge);
        if (assertionPayload.allowCredentials) {
            for (const credential of assertionPayload.allowCredentials) {
                console.log("cred :" + credential.id);
                credential.id = utils.encoding.base64ToBuffer(credential.id);
            }
        }

        const credential = await utils.navigator.getCredential({ publicKey: assertionPayload });
        const response = <AuthenticatorAssertionResponse>credential.response

        // Complete the authentication flow
        const completePayload = <{
            username: string;
            challenge: string;
            credential_id: string;
            client_data: string;
            authenticator_data: string;
            signature: string;
        }> {
            username,
                challenge,
                credential_id: utils.encoding.bufferToBase64(credential.rawId),
                client_data: utils.encoding.bufferToBase64(response.clientDataJSON),
                authenticator_data: utils.encoding.bufferToBase64(response.authenticatorData),
                signature: utils.encoding.bufferToBase64(response.signature),
        };

        return await utils.http.post(
            this._baseURL,
            "/api/authenticate/complete",
            completePayload,
        );
    }



}