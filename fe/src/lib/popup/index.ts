/*
 *   Copyright (c) 2024 LoginID Inc
 *   All rights reserved.

 *   Licensed under the Apache License, Version 2.0 (the "License");
 *   you may not use this file except in compliance with the License.
 *   You may obtain a copy of the License at

 *   http://www.apache.org/licenses/LICENSE-2.0

 *   Unless required by applicable law or agreed to in writing, software
 *   distributed under the License is distributed on an "AS IS" BASIS,
 *   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *   See the License for the specific language governing permissions and
 *   limitations under the License.
 */

import { MessagingService } from "./messaging";
import { closePopup, defaultOptions, openPopup } from "./popup";

interface SignTxnsError extends Error {
    code: number;
    data?: any;
}

export type TxnId = string;
export type AlgorandAddress = string;

// support enable function
// support optional network "mainnet | testnet | sandnet"
export interface EnableOpts {
    network?: string;
    genesisID?: string;
    genesisHash?: string;
}

export interface EnableResult {
    genesisID: string;
    genesisHash: string;
    accounts: AlgorandAddress[];
}

export type SignTxnsOpts = {
    /**
     * Optional message explaining the reason of the group of transactions
     */
    message?: string;
}

export interface TxnsResult {
    txnIds: TxnId[];
    signTxn: string[];
}

export interface PostTxnsError extends Error {
    code: number;
    data?: any;
    successTxnIds: (TxnId | null)[];
}


export interface WalletTransaction {
    /**
     * Base64 encoding of the canonical msgpack encoding of a Transaction.
     */
    txn: string;
    /**
    * Optional authorized address used to sign the transaction when the account
    * is rekeyed. Also called the signor/sgnr.
    */
    authAddr?: AlgorandAddress;

    /**
     * Optional list of addresses that must sign the transactions
     */
    signers?: AlgorandAddress[];

    /**
     * Optional base64 encoding of the canonical msgpack encoding of a 
     * SignedTxn corresponding to txn, when signers=[]
     */
    stxn?: string;

    /**
     * Optional message explaining the reason of the transaction
     */
    message?: string;

    /**
     * Optional message explaining the reason of this group of transaction
     * Field only allowed in the first transaction of a group
     */
    groupMessage?: string;
}

export class FidoVaultSDK {

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

    async enable(network: EnableOpts): Promise<EnableResult> {
        closePopup(this.w)
        this.w = openPopup(this.baseURL + "/fe/api/enable", "enable", defaultOptions);
        //this.w.postMessage(JSON.stringify(network),FidoVaultSDK.baseURL);
        let isLoad = await this.mMessage.pingForResponse(this.w, 20000);
        if (!isLoad) {
            return Promise.reject({ message: "communication timeout" });
        }

        let message: Message = {
            channel: "wallet-communication-channel",
            message: JSON.stringify(network)
        };
        let response = await this.mMessage.sendMessageText(this.w, JSON.stringify(network));

        let enable: EnableResult = JSON.parse(response);
        return Promise.resolve(enable);
    }

    /**
     * signTxns
     * https://github.com/algorandfoundation/ARCs/blob/main/ARCs/arc-0001.md 
     * https://github.com/algorandfoundation/ARCs/blob/main/ARCs/arc-0005.md 
     * @returns {Promise<string|null> []}
     * 
    **/
    async signTxns(txns: WalletTransaction[], opts?: SignTxnsOpts): Promise<TxnsResult> {
        this.w = openPopup(this.baseURL + "/fe/api/transaction", "sign", defaultOptions);
        let isLoad = await this.mMessage.pingForResponse(this.w, 30000);
        if (!isLoad) {
            return Promise.reject({ message: "communication timeout" });
        }
        let message: Message = {
            channel: "wallet-communication-channel",
            message: JSON.stringify(txns)
        };
        let response = await this.mMessage.sendMessageText(this.w, JSON.stringify(txns));
        let result: TxnsResult = JSON.parse(response);
        return Promise.resolve(result);
    }


    /**
     * signAndPostTxns
     * https://github.com/algorandfoundation/ARCs/blob/main/ARCs/arc-0008.md 
     * @returns {Promise<string|null> []}
     * 
    **/
    async signAndPostTxns(txns: WalletTransaction[], opts?: SignTxnsOpts): Promise<TxnsResult> {
        this.w = openPopup(this.baseURL + "/fe/api/transaction", "signpost", defaultOptions);
        let isLoad = await this.mMessage.pingForResponse(this.w, 30000);
        if (!isLoad) {
            return Promise.reject({ message: "communication timeout" });
        }
        let message: Message = {
            channel: "wallet-communication-channel",
            message: JSON.stringify(txns)
        };
        let response = await this.mMessage.sendMessageText(this.w, JSON.stringify(txns));
        let result: TxnsResult = JSON.parse(response);
        return Promise.resolve(result);
    }



}


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