import { MessagingService } from "./messaging";


export interface SignupResult {
    token?: string;
}

export class FederatedSDK {

    baseURL = "http://localhost:3000";
    mMessage: MessagingService;
    w: Window | null

    constructor(url: string) {
        if (url !== "") {
            this.baseURL = url;
        }
        //this.mMessage = new MessagingService(FidoVaultSDK.baseURL);
        this.mMessage = new MessagingService("*");
        this.w = null;
    }
    /**
    *  
    *   https://github.com/algorandfoundation/ARCs/blob/main/ARCs/arc-0006.md
    */

    async signUp(target: Window): Promise<SignupResult> {
        let isLoad = await this.mMessage.pingForResponse(target, 20000);
        if (!isLoad) {
            return Promise.reject({ message: "communication timeout" });
        }

        let response = await this.mMessage.sendMessage(target, JSON.stringify({data:"hello"}), "init");

        let result: SignupResult = JSON.parse(response);
        return Promise.resolve(result);
    }

}