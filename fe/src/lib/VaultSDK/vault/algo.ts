import { WalletTransaction } from "../../common/api";
import Base from "../base";
import utils from "../utils";

export interface AccountList {
    accounts: Account[]
}

export interface Account {
    alias: string
    id: string;
    address: string;
    iat: string;
    status: string;
    credentials_name: string[];
    credentials_id: string[];
    recovery_address: string;
    teal_script: string;
    balance?: AccountBalance;
    auth_address?: string;
    transactions: TxRecord[];
    assets: AssetRecord[];
    dapps: EnableAccount[];
}

export interface AccountBalance {
    amount: number;
    current_round: number;
    status: string;
    asa_count: number;
}

export interface ContractAccount {
    address: string;
    teal_script: string;
    compile_script: string;
}

export interface AlgoAccountCreationRequest {
    alias: string;
    verify_address: string;
    cred_id_list: string[];
    recovery: string;
}

export interface EnableRequest {
    address_list: string[];
    origin: string;
    network: string;
}
export interface Genesis {
    id: string;
    hash: string;
}
export interface EnableAccountList {
    accounts: EnableAccount[]
}
export interface EnableAccount {
    id: string;
    wallet_address: string;
    network: string;
    dapp_origin: string;
    iat: string;
}

export interface TxnValidationRequest {
    transactions: WalletTransaction[];
    origin: string;
}

export interface TxnValidationResponse {
    txn_data: string[];
    txn_type: string[];
    required: boolean[];
    origin: string;
}

export interface SignedTxn {
    stxn: string;
    tx_id: string;
}


export interface BaseTransaction {
    base: {
        from: string;
        fee: number;
        note: string;
        raw_data: string;
        sign_payload: string; // txnID
        sign_nonce: string; // generated nonce
        username: string;
        alias: string;
        require: boolean;
    }
    type: string;
    iat: string;
}

export interface PaymentTransaction extends BaseTransaction {
    to: string;
    amount: number;
}

export interface AssetOptin extends BaseTransaction {
    assetid: number;
    name: string;
    unit: string;
}

export interface AssetTransfer extends BaseTransaction{
    to: string;
    assetid: number;
    amount: number;
}

export interface AppOptin extends BaseTransaction {
    appid: number;
}

export interface AppCall extends BaseTransaction{
    appid: number;
}

export interface Rekey extends BaseTransaction{
    rekey: string;
}


// Transaction Report
export interface TxRecord {
    "round-time" : number;
    id: string;
    "tx-type": string;
    "payment-transaction"?: TxPaymentRecord;
    "asset-transfer-transaction"?: TxAssetTransfer;
    "application-transaction"?: TxApplication;
    "rekey-to": string;
    fee: number;
    sender: string;
}

export interface TxList {
    "next-token": string;
    "current-round": number;
    transactions: TxRecord[];
}

export interface TxPaymentRecord {
    receiver: string;
    amount: number;
    "close-amount": number;
}

export interface TxApplication {
    "application-id": number;
    "on-completion": string;
}

export interface TxAssetTransfer {
    "asset-id" : number;
    amount: number;
    receiver: string;

}

export interface AssetRecord {
    id : number;
    name: string;
    amount: number;
    unit: string;
}


export class VaultAlgo extends Base {

    async getAccountList(token: string, balance: boolean = false): Promise<AccountList> {
        const header = { "x-session-token": token };
        return await utils.http.get(
            this._baseURL,
            "/api/protected/algo/getAccountList",
            {include_balance: balance},
            header
        );
    }

    async getAccount(token: string, address: string,  balance: boolean = false): Promise<Account> {
        const header = { "x-session-token": token };
        return await utils.http.get(
            this._baseURL,
            "/api/protected/algo/getAccount",
            {address: address, include_balance: balance },
            header
        );
    }

    async createAccount(token: string, request: AlgoAccountCreationRequest): Promise<any> {
        const header = { "x-session-token": token };
        return await utils.http.post(
            this._baseURL,
            "/api/protected/algo/createAccount",
            request,
            header
        );
    }


    async quickCreateAccount(token: string): Promise<Account> {
        const header = { "x-session-token": token };
        return await utils.http.post(
            this._baseURL,
            "/api/protected/algo/quickAccountCreation",
            {},
            header
        );
    }

    async renameAccount(token: string, id: string, alias: string): Promise<any> {
        const header = { "x-session-token": token };
        return await utils.http.post(
            this._baseURL,
            "/api/protected/algo/renameAccount",
            {id, alias},
            header
        )
    }

    async generateScript(token: string, credentials: string[], recovery: string): Promise<ContractAccount> {
        const header = { "x-session-token": token };
        return await utils.http.post(
            this._baseURL,
            "/api/protected/algo/generateScript",
            { credential_list: credentials, recovery: recovery },
            header
        );
    }

    async enable(token: string, address_list: string[], origin: string, network: string): Promise<Genesis> {
        const header = { "x-session-token": token };
        return await utils.http.post(
            this._baseURL,
            "/api/wallet/enable",
            { address_list: address_list, origin: origin, network: network },
            header
        );
    }

    async getEnableAccountList(token: string): Promise<EnableAccountList> {
        const header = { "x-session-token": token };
        return await utils.http.get(
            this._baseURL,
            "/api/protected/algo/getEnableAccountList",
            undefined,
            header
        );
    }


    async getTransactionList(token: string, address: string): Promise<TxList> {
        const header = { "x-session-token": token };
        return await utils.http.post(
            this._baseURL,
            "/api/protected/algo/getTransactions",
            {address: address},
            header
        );
    }

    async revokeEnableAccount(token: string, id: string): Promise<any> {
        const header = { "x-session-token": token };
        return await utils.http.post(
            this._baseURL,
            "/api/protected/algo/revokeEnableAccount",
            { ID: id },
            header
        )
    }


    async addAsset(token: string, id: number, address: string, origin: string): Promise<TxnValidationResponse> {
        const header = { "x-session-token": token };
        return await utils.http.post(
            this._baseURL,
            "/api/protected/algo/createAssetOptin",
            { id: id, origin: origin, address: address },
            header
        );
    }

    async createSendPayment(token: string, fromAddress: string, toAddress: string, amount: number, origin: string): Promise<TxnValidationResponse> {
        const header = { "x-session-token": token };
        return await utils.http.post(
            this._baseURL,
            "/api/protected/algo/createSendPayment",
            { from_address: fromAddress, to_address: toAddress, amount: amount, origin: origin },
            header
        );
    }

    async txnValidation(transactions: WalletTransaction[], origin: string): Promise<TxnValidationResponse> {
        //const header = { "x-session-token": token };
        return await utils.http.post(
            this._baseURL,
            "/api/wallet/txValidation",
            { transactions: transactions, origin: origin },
        );
    }

    async txConfirmation(username: string, payload: string, nonce: string, rawTxn: string, post: boolean): Promise<SignedTxn> {

        let headers;

        // Init the authentication flow
        let initPayload = <{
            username: string;
            payload: string;
            nonce: string;
        }>{
                username,
                payload,
                nonce,
            };

        console.log(payload);
        let initResponse = await utils.http.post(
            this._baseURL,
            "/api/wallet/txInit",
            initPayload,
            headers
        );

        // console.log(initResponse);
        // Process the authenticate init response and request the credential from the browser
        const {
            assertion_options: assertionPayload,
            tx_id: tx_id,
        } = initResponse;

        const { challenge } = assertionPayload;
        assertionPayload.challenge = utils.encoding.base64ToBuffer(assertionPayload.challenge);
        if (assertionPayload.allowCredentials) {
            for (const credential of assertionPayload.allowCredentials) {
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
            raw_txn: string;
            tx_id: string;
            post: boolean;
        }>{
                username,
                challenge,
                tx_id,
                post,
                raw_txn: rawTxn,
                credential_id: utils.encoding.bufferToBase64(credential.rawId),
                client_data: utils.encoding.bufferToBase64(response.clientDataJSON),
                authenticator_data: utils.encoding.bufferToBase64(response.authenticatorData),
                signature: utils.encoding.bufferToBase64(response.signature),
            };

        return await utils.http.post(
            this._baseURL,
            "/api/wallet/txComplete",
            completePayload,
        );
    }

    async rekeyConfirmation(token: string, address: string, credential_list:string[], recovery: string): Promise<SignedTxn> {

        const header = { "x-session-token": token };

        // Init the authentication flow
        let initPayload = <{
            address: string;
            cred_id_list: string[];
            recovery: string;
        }>{
                address,
                cred_id_list:  credential_list,
                recovery,
            };

        let initResponse = await utils.http.post(
            this._baseURL,
            "/api/protected/algo/rekeyInit",
            initPayload,
            header
        );

        console.log(initResponse);
        // Process the authenticate init response and request the credential from the browser
        const {
            assertion_options: assertionPayload,
            tx_id: tx_id,
        } = initResponse.fido;

        const raw_txn = initResponse.raw_txn;
        console.log(raw_txn);

        const { challenge } = assertionPayload;
        assertionPayload.challenge = utils.encoding.base64ToBuffer(assertionPayload.challenge);
        if (assertionPayload.allowCredentials) {
            for (const credential of assertionPayload.allowCredentials) {
                credential.id = utils.encoding.base64ToBuffer(credential.id);
            }
        }

        const credential = await utils.navigator.getCredential({ publicKey: assertionPayload });
        const response = <AuthenticatorAssertionResponse>credential.response

        // Complete the authentication flow
        const completePayload = <{
            challenge: string;
            credential_id: string;
            client_data: string;
            authenticator_data: string;
            signature: string;
            tx_id: string;
            raw_txn: string;
        }>{
                challenge,
                tx_id,
                credential_id: utils.encoding.bufferToBase64(credential.rawId),
                client_data: utils.encoding.bufferToBase64(response.clientDataJSON),
                authenticator_data: utils.encoding.bufferToBase64(response.authenticatorData),
                signature: utils.encoding.bufferToBase64(response.signature),
                raw_txn: raw_txn,
            };

        return await utils.http.post(
            this._baseURL,
            "/api/protected/algo/rekeyComplete",
            completePayload,
        );
    }


}