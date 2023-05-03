import utils from "./utils";

export interface DispenserResponse {
    address: string;
    amount: number;
}

export interface DispenserSignResponse {
    stxn: string;
}

export interface DispenserPostResponse {
    id: string;
}

export class DispenserSDK {
    static baseURL = process.env.REACT_APP_DISPENSER_URL || "http://localhost:3001";
    static async dispense (address : string) : Promise<DispenserResponse> {
        const header = { "x-api-token": "loginid-dispenser" };
        return await utils.http.post(
            DispenserSDK.baseURL,
            "/api/dispenser/deposit",
            {address: address},
            header
        );
    }

    static async sign (txn : string) : Promise<DispenserSignResponse> {
        const header = { "x-api-token": "loginid-dispenser" };
        return await utils.http.post(
            DispenserSDK.baseURL,
            "/api/dispenser/sign",
            {txn: txn},
            header
        );
    }

    static async post (stxn : string[]) : Promise<DispenserPostResponse> {
        const header = { "x-api-token": "loginid-dispenser" };
        return await utils.http.post(
            DispenserSDK.baseURL,
            "/api/dispenser/post",
            {stxn: stxn},
            header
        );
    }
}