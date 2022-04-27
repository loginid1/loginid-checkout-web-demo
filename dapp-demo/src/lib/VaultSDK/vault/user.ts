import Base from "../base";
import utils from "../utils";

export interface Profile {
    num_credential : number;
    num_recovery : number;
    num_algorand : number;
    recent_activity : string;
}

export interface Credential {
    id: string;
    name: string;
    public_key: string;
    key_alg: string;
    iat: string;

}


export interface Credentials {
    credentials : Credential []
}

export interface RecoveryList {
    recovery : Recovery []
}

export interface Recovery {
    id: string;
    public_key: string;
    iat: string;

}

export interface RecoveryPhrase {
    id: string;
    public_key: string;
    // this is in mnemonic phrases
    private_key: string;
}

export interface CredentialCode {
    code: string;
    expires_at: string;
    is_authorized: boolean;
}

export class VaultUser extends Base{

    async getProfile(token: string) : Promise<Profile>  {
        const header = { "x-session-token": token };
        return await utils.http.get(
            this._baseURL,
            "/api/protected/user/profile",
            undefined,
            header
        );
    }

    async getCredentials(token: string) : Promise<Credentials> {
        const header = { "x-session-token": token };
        return await utils.http.get(
            this._baseURL,
            "/api/protected/user/getCredentialList",
            undefined,
            header
        );
    }

    async getRecoveryList(token: string) : Promise<RecoveryList> {
        const header = { "x-session-token": token };
        return await utils.http.get(
            this._baseURL,
            "/api/protected/user/getRecoveryList",
            undefined,
            header
        );
    }

    async createRecovery(token: string) : Promise<RecoveryPhrase> {
        const header = { "x-session-token": token };
        return await utils.http.post(
            this._baseURL,
            "/api/protected/user/createRecovery",
            {},
            header
        );
    }

    async generateCredentialCode(token: string) : Promise<CredentialCode> {
        const header = { "x-session-token": token };
        return await utils.http.post(
            this._baseURL,
            "/api/protected/user/generateCredentialCode",
            {},
            header
        );
    }
}