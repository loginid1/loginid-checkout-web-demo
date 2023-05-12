import Base from "../base";
import utils from "../utils";

export interface PhonePass {
    phone_number: string
}

export interface EmailPass {
    email: string
}

export interface DriversLicensePass {
    document_number: string;
    document_country?: string;
    personal_id_number?: string;
    full_name?: string;
    address?: string;
    date_of_birth: Date;
    date_of_issue?: Date;
    date_of_expiry?: Date;
}

export interface Pass {
    id: string
    user_id: string;
    name: string;
    attributes: string;
    schema: string;
    issuer: string;
    data: PhonePass | EmailPass | DriversLicensePass;
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

    async createDriversLicensePass(token: string, pass_name: string, data: DriversLicensePass): Promise<void> {
        const header = { "x-session-token": token };
        return await utils.http.post(
            this._baseURL,
            "/api/protected/passes/drivers-license",
            {pass_name, data},
            header
        );
    }
}