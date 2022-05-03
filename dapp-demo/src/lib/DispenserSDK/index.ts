import utils from "./utils";

export interface DispenserResponse {
    address: string;
    amount: number;
}

export class DispenserSDK {
    static baseURL = process.env.REACT_APP_DISPENSER_URL || "http://localhost:3001";
    static async dispense (address : string) : Promise<DispenserResponse> {
        const header = { "x-api-token": "loginid-dispenser" };
        return await utils.http.post(
            DispenserSDK.baseURL,
            "/api/dispenser/withdraw",
            {address: address},
            header
        );
    }
}