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

import { base64EncodeUrl, bufferToBase64, stringToBase64Url } from "./encoding"

interface Keystore {
    id: string
    key: CryptoKeyPair
}

interface CHeader {
    kid: string
    alg: string
    jwk: any
}

interface CClaims {
    sub: string
    exp: number
}

interface CIDResult {
    id: string
    token: string
    valid: boolean
}


const DB_NAME = "CedDB";
const DB_STORE = "Keystore";

const CID_VAL= "cid-validation";
const CID_KID= "cid-kid";

export class CID {

    /**
     * Create trustID of following username
     * @param username 
     * @returns 
     */
    static async create(): Promise<CIDResult> {
        const keypair = await CIDHelper.generateKey();
        const id = crypto.randomUUID();
        const dbResult = await CIDHelper.storeKeystore(id,  keypair);
        if (dbResult) {
            const pk = await crypto.subtle.exportKey("jwk", keypair.publicKey);
            const header: CHeader = {
                kid: id,
                alg: CIDHelper.DEFAULT_JWT_ALG,
                jwk: pk,
            };
            let exp = new Date();
            exp.setMinutes(exp.getMinutes() + 5);
            const claims: CClaims = {
                sub: id,
                exp: exp.getTime()
            };
            const token = await CIDHelper.buildCJWT(keypair, header, claims);
            localStorage.setItem(CID_KID, id);
            return { id: id, token: token, valid: false };
        } else {
            throw new Error("error storing trust db");
        }
    }

    /**
     * build JWT for trustID authentication
     * 
     * @param username 
     * @param challenge 
     * @param challengeType 
     * @returns 
     */
    static async sign(id: string): Promise<CIDResult> {

        const dbResult = await CIDHelper.loadKeystore(id);
        let exp = new Date();
        exp.setMinutes(exp.getMinutes() + 5);
        if (dbResult) {
            const pk = await crypto.subtle.exportKey("jwk", dbResult.key.publicKey);
            const header: CHeader = {
                kid: id,
                alg: CIDHelper.DEFAULT_JWT_ALG,
                jwk: pk,
            };

            const claims: CClaims = {
                sub: id,
                exp: exp.getTime()
            };
            const token = await CIDHelper.buildCJWT(dbResult.key, header, claims);
            return { id: id, token: token, valid:localStorage.getItem("cid-validation") == "true" ?true:false };
        } else {
            // key database may be deleted
            throw new Error("error loading key from db")
        }
    }

    static hasCID(): boolean {
        return localStorage.getItem(CID_VAL) === "true"? true:false
    }

    static setCIDValid() {
        localStorage.setItem(CID_VAL, "true");
    }

    /**
     * Get trustID kid from passkey credential id instead of username - this feature is used during autofill 
     * 
     * @param credid 
     * @returns 
     */
    static async getLatest(): Promise<CIDResult> {
        const id = localStorage.getItem(CID_KID);
        if(id){
            try{
                return await CID.sign(id);
            } catch(e) {
                // error try to create new
                console.log(e);
                return await CID.create();
            }
        }  else {
            return await CID.create();
        } 
    }

    static async test() {
        let keypair = await CIDHelper.generateKey();
        let id = window.crypto.randomUUID();
        let encoder = new TextEncoder();
        let challenge = encoder.encode("challenge");
        let signature = await CIDHelper.sign(keypair, challenge);
        await CIDHelper.storeKeystore(id,  keypair);
        // verify
        let keystore = await CIDHelper.loadKeystore(id);
        if (keystore) {
            let pk = await window.crypto.subtle.exportKey("jwk", keypair.publicKey)
            //console.log("private: ", await window.crypto.subtle.exportKey("jwk",keystore.privateKey));
            console.log("public: ", pk);
            let result = await CIDHelper.verify(keystore.key, signature, challenge )
            console.log(result);
        }
        console.log("end crypto test");
    }

}

class CIDHelper {

    static DEFAULT_JWT_ALG = "ES256"
    static KG_DEFAULT_ALGORITHM = {
        name: "ECDSA",
        namedCurve: "P-256",
    }
    static ES256_ALGORITHM = {
        name: "ECDSA",
        hash: { name: "SHA-256" },
    }
    /**
     * Load latest device id
     * @param id device id
     * @returns 
     */
    static async loadKeystore(id: string): Promise<Keystore | null> {

        return new Promise<Keystore | null>((resolve) => {

            // Open (or create) the database
            var open = window.indexedDB.open(DB_NAME, 1);

            // Create the schema
            open.onupgradeneeded = function () {
                var db = open.result;
                if (!db.objectStoreNames.contains(DB_STORE)) {
                    db.createObjectStore(DB_STORE, { keyPath: "id" });
                }
            };

            open.onerror = function () {
                resolve(null)
            }
            open.onsuccess = function () {
                // Start a new transaction
                var db = open.result;
                var tx = db.transaction(DB_STORE, "readwrite");
                var store = tx.objectStore(DB_STORE);
                const request = store.get(id);
                request.onsuccess = function () {
                    var keystore: Keystore = request.result;
                    resolve(keystore);
                }
                request.onerror = function () {
                    resolve(null);
                }

                // Close the db when the transaction is done
                tx.oncomplete = function () {
                    db.close();
                };
            }
        });
    }

    static async storeKeystore(id: string,  key: CryptoKeyPair): Promise<boolean> {
        return new Promise<boolean>((resolve) => {

            // Open (or create) the database
            var open = window.indexedDB.open(DB_NAME, 1);

            // Create the schema
            open.onupgradeneeded = function () {
                var db = open.result;
                if (!db.objectStoreNames.contains(DB_STORE)) {
                    db.createObjectStore(DB_STORE, { keyPath: "id" });
                }
            };

            open.onerror = function () {
                resolve(false)
            }
            open.onsuccess = function () {
                // Start a new transaction
                var db = open.result;
                var tx = db.transaction(DB_STORE, "readwrite");
                var store = tx.objectStore(DB_STORE);
                let keystore: Keystore = {
                    id: id,
                    key: key,
                }
                store.put(keystore);

                // Close the db when the transaction is done
                tx.oncomplete = function () {
                    db.close();
                    resolve(true);
                };
            }
        });

    }

    static async generateKey(): Promise<CryptoKeyPair> {
        return await window.crypto.subtle.generateKey(this.KG_DEFAULT_ALGORITHM, false, ["sign", "verify"])
    }

    /**
     * 
     * @param key CryptoKey of Ced Device Key
     * @param payload payload needed to be signed
     */
    static async sign(key: CryptoKeyPair, payload: BufferSource): Promise<ArrayBuffer> {
        return await window.crypto.subtle.sign(this.ES256_ALGORITHM, key.privateKey, payload)
    }

    static async verify(key: CryptoKeyPair, signature: ArrayBuffer, challenge: BufferSource): Promise<boolean> {
        return await window.crypto.subtle.verify(this.ES256_ALGORITHM, key.publicKey, signature, challenge)
    }

    static async buildCJWT(keypair: CryptoKeyPair, header: CHeader, claims: CClaims): Promise<string> {
        const b64Header = stringToBase64Url(JSON.stringify(header));
        const b64Claims = stringToBase64Url(JSON.stringify(claims));
        var enc = new TextEncoder();
        const encPayload = enc.encode(b64Header + "." + b64Claims);
        const sig = await CIDHelper.sign(keypair, encPayload);
        const b64Sig = bufferToBase64(sig);
        const jws = b64Header + "." + b64Claims + "." + b64Sig;
        return jws;
    }

}

