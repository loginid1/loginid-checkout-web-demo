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

    async enable(token: string, address_list: string[], origin: string, network: string) : Promise<boolean> {
        const header = { "x-session-token": token };
        return await utils.http.post(
            this._baseURL,
            "/api/wallet/enable",
            {address_list: address_list, origin: origin, network: network},
            header
        );
    }

}