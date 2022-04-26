import {  defaultOptions, openPopup } from "./popup";

interface SignTxnsError extends Error {
    code: number;
    data?: any;
}

export type TxnId = string;
export type AlgorandAddress = string;

// support enable function
export interface EnableOpts  {
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

export interface PostTxnsResult {
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
   stxn: string;

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

    static baseURL="http://localhost:3000";
    /**
    *  
    *   https://github.com/algorandfoundation/ARCs/blob/main/ARCs/arc-0006.md
    */

    static async enable( network: EnableOpts): Promise<EnableResult | null> {
        let w = openPopup(FidoVaultSDK.baseURL+"/fe/enable", defaultOptions);
        //w.postMessage(JSON.stringify(network),FidoVaultSDK.baseURL);
        await new Promise((resolve) => setTimeout(resolve, 400));
        console.log("postmessage " + window.origin);
        let message : Message = {
            channel : "wallet-communication-channel",
            message : JSON.stringify(network)
        }; 
        w.postMessage(JSON.stringify(message),"*");
        return Promise.resolve(null);
    }

    /**
     * signTxns
     * https://github.com/algorandfoundation/ARCs/blob/main/ARCs/arc-0001.md 
     * https://github.com/algorandfoundation/ARCs/blob/main/ARCs/arc-0005.md 
     * @returns {Promise<string|null> []}
     * 
    **/
    async signTxns(txns: WalletTransaction[], opts: SignTxnsOpts): Promise<(PostTxnsResult | null)[]> {
        return Promise.resolve([]);
    }


    /**
     * signAndPostTxns
     * https://github.com/algorandfoundation/ARCs/blob/main/ARCs/arc-0008.md 
     * @returns {Promise<string|null> []}
     * 
    **/
    async signAndPostTxns(txns: WalletTransaction[], opts: SignTxnsOpts): Promise<(PostTxnsResult | null)[]> {
        return Promise.resolve([]);
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
 async function waitForWindowToLoad(targetWindow : Window, retries = 30) {
    for (let i = 0; i < retries; i++) {
        await sleep(300);
    }
}

async function sleep(ms: number) {
    await new Promise((resolve) => setTimeout(resolve, ms));
}

export interface Message{
    channel: string;
    message: string;
    method?: string;
    id?: string;
}