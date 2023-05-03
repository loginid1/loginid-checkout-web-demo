
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

 export interface LoginResult {
    token: string;
 }

export interface WalletInit {
	api: string;
}