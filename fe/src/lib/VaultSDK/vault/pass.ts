import Base from "../base";
import utils from "../utils";

export interface Pass {
    user_id: string;
    attributes: string;
    schema: string;
    issuer: string;
    data: any;
    created_at: Date;
}

export class VaultPass extends Base{
    async getPasses(token: string): Promise<Pass[]> {
        const header = { "x-session-token": token };
        return await utils.http.get(
            this._baseURL,
            "/api/protected/passes",
            undefined,
            header
        );
    }

    async createPhonePassInit(token: string, phone_number: string): Promise<void> {
        const header = { "x-session-token": token };
        return await utils.http.post(
            this._baseURL,
            "/api/protected/passes/phone/init",
            {phone_number},
            header
        );
    }

    async createPhonePassComplete(token: string, pass_name: string, phone_number: string, code: string): Promise<void> {
        const header = { "x-session-token": token };
        return await utils.http.post(
            this._baseURL,
            "/api/protected/passes/phone/complete",
            {pass_name, phone_number, code},
            header
        );
    }
}