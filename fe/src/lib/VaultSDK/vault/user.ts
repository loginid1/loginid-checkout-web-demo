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
}