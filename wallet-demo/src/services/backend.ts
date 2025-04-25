import { b2a } from "@/lib/encoding";
import { CheckoutRequest } from "@/pages/checkout";

export interface BankingResult {
    token: string;
}
const loginidBaseUrl = process.env.REACT_APP_LOGINID_BASE_URL || "";
const loginidKey = process.env.REACT_APP_LOGINID_APIKEY || "";
export class WalletMockService {

    static async bankingResult(session: string | null, username: string): Promise<BankingResult> {
        const url = loginidBaseUrl + "/fido2/v2/mgmt/grant/external-auth";
        const auth = "Baic " + b2a(loginidKey);
        //const auth = "Baic " + b2a("test");
        const data = `{

            "username": "${username}"
        
        }`
        const resp = await fetch(url, {
            method: "POST",
            headers: {
                "Authorization": auth,
                "Content-Type": "application/json",
              },
            body: data,
        });
        if (resp.ok) {
            const tok = await resp.json()
            return tok;
        }
        return Promise.reject("no result");
    }

    static async setupOrder(checkout: CheckoutRequest): Promise<string> {
        const id = window.crypto.randomUUID();
        sessionStorage.setItem(id, JSON.stringify(checkout));
        return Promise.resolve(id);

    }

    static async getOrder(id: string): Promise<CheckoutRequest | null> {
        try {
            const data = sessionStorage.getItem(id);
            if (data) {
                const order = JSON.parse(data)
                return Promise.resolve(order);
            } else {
                return Promise.resolve(null);
            }
        } catch (e) {
            console.log(e);
            return Promise.resolve(null);
        }
    }
}