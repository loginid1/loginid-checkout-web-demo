import Base from "../base";
import utils from "../utils";

export interface AccountList {
    accounts : Account []
}

export interface Account {
    id: string;
    address: string;
    iat: string;

}

export interface ContractAccount {
    address: string;
    teal_script: string;
    compile_script: string;
}

export interface AlgoAccountCreationRequest {
    verify_address: string;
    credential_list: string [];
    recovery: string;
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
        console.log(credentials, " ", recovery);
        return await utils.http.post(
            this._baseURL,
            "/api/protected/algo/generateScript",
            {credential_list: credentials, recovery: recovery},
            header
        );
    }

}