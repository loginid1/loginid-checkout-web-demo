import Base from "../base";
import utils from "../utils";
import { MessagingService } from "./messaging";
import { closePopup, defaultOptions, openPopup } from "./popup";

export interface AlgoPurchaseInitResponse {
    url: string;
    reservation: string;
}
export interface OrderFees {

}
export interface OrderResponse {
  transferId: string;
  feeCurrency: string;
  fee: number;
  sourceCurrency: string;
  destCurrency: string;
  sourceAmount: number;
  destAmount: number;
  destSrn: string;
  //"pusherChannel": "ce2c1877e1ebb56dc9b68dc8cd55fbf1",
  //"from": "Walletorderholding WO_HGF4BY7QXY",
  //"to": null,
  rate: number;
  //"customId": null,
  //"blockchainNetworkTx": null,
  //"message": null,
  /*
  "transferHistoryEntryType": "OUTGOING",
  "successTimeline": [
    {
      "statusDetails": "Initiating Transfer",
      "state": "INITIATED",
      "createdAt": 1659621613000
    },
    {
      "statusDetails": "Processing Exchange",
      "state": "PENDING",
      "createdAt": 1659621613000
    },
    {
      "statusDetails": "Processing Deposit",
      "state": "PENDING",
      "createdAt": 1659621613000
    }
  ],
  */
  //failedTimeline: [],
  failureReason: string,
  reversalReason: string
}

export class SendwyreSDK {

    baseURL = process.env.REACT_APP_VAULT_API_URL || "http://localhost:3001";
    swURL = process.env.REACT_APP_SENDWIRE_URL || "https://api.testwyre.com";
    
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


    async track(transferId: string): Promise<OrderResponse> {
        return await utils.http.get(
            this.swURL,
            `/v2/transfer/${transferId}/track`
        );
    }

    async orderInit(token: string, address: string, redirectUrl: string): Promise<AlgoPurchaseInitResponse > {
        const header = { "x-session-token": token };
        return await utils.http.post(
            this.baseURL,
            "/api/protected/algo/algoPurchaseInit",
            { address: address, redirectUrl: redirectUrl },
            header
        );
    }

    async orderCall(address: string) {
        closePopup(this.w)
        this.w = openPopup("/fe/algo/order/"+address, "order", defaultOptions);
   
        /*
        let isLoad = await this.mMessage.pingForResponse(this.w, 30000);
        if (!isLoad) {
            return Promise.reject({ message: "communication timeout" });
        }
        console.log("postmessage " + window.origin);
        let message: Message = {
            channel: "wallet-communication-channel",
            message: JSON.stringify(txns)
        };
        let response = await this.mMessage.sendMessageText(this.w, JSON.stringify(txns));
        console.log("message: " + response);
        let result: PostTxnsResult = JSON.parse(response);
        return Promise.resolve(result);
        */
    }


}

const BASE_URL = process.env.REACT_APP_VAULT_API_URL || "http://localhost:3001";
const wyreSDK = new SendwyreSDK(BASE_URL);
export default wyreSDK;
/**
     * @async
     * @access private
     * @description Wait until the window opened loads.
     * @param {Window} targetWindow Window opened context.
     * @param {number} retries Times to retry before throw an error.
     * @returns {Promise<void>} Throw error if the window does not load.
     */
async function waitForWindowToLoad(targetWindow: Window, retries = 30) {
    for (let i = 0; i < retries; i++) {
        await sleep(300);
    }
}

async function sleep(ms: number) {
    await new Promise((resolve) => setTimeout(resolve, ms));
}

export interface Message {
    channel: string;
    message: string;
    method?: string;
    id?: string;
}