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

import { base64EncodeUrl, bufferToBase64, stringToBase64Url } from "./encoding";

interface Keystore {
  id: string;
  username: string;
  key: CryptoKeyPair;
}

interface TrustHeader {
  kid: string;
  alg: string;
}

interface TrustClaims {
  sub: string;
  username: string;
  chal: string;
  ctype: string;
  pk?: any; // require for Register claim
}

interface TrustIDResult {
  id: string;
  token: string;
}

const DB_NAME = "TrustedDB";
const DB_STORE = "Keystore";

export class TrustID {
  /**
   * Create trustID of following username
   * @param username
   * @returns
   */
  static async create(
    username: string,
    challenge: string,
    challengeType: string,
  ): Promise<TrustIDResult> {
    const keypair = await TrustIDHelper.generateKey();
    const id = crypto.randomUUID();
    const dbResult = await TrustIDHelper.storeKeystore(id, username, keypair);
    if (dbResult) {
      const header: TrustHeader = {
        kid: id,
        alg: TrustIDHelper.DEFAULT_JWT_ALG,
      };

      const pk = await crypto.subtle.exportKey("jwk", keypair.publicKey);
      const claims: TrustClaims = {
        sub: id,
        username: username,
        pk: pk,
        chal: challenge,
        ctype: challengeType,
      };
      const token = await TrustIDHelper.buildTrustJWT(keypair, header, claims);
      localStorage.setItem("trustkid-" + username, id);
      return { id: id, token: token };
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
  static async sign(
    username: string,
    challenge: string,
    challengeType: string,
  ): Promise<TrustIDResult> {
    // get trustkid from username
    const id = localStorage.getItem("trustkid-" + username);
    if (id == null) {
      throw new Error("no id found");
    }
    const dbResult = await TrustIDHelper.loadKeystore(id);
    if (dbResult) {
      const header: TrustHeader = {
        kid: id,
        alg: TrustIDHelper.DEFAULT_JWT_ALG,
      };

      const claims: TrustClaims = {
        sub: id,
        username: username,
        chal: challenge,
        ctype: challengeType,
      };
      const token = await TrustIDHelper.buildTrustJWT(
        dbResult.key,
        header,
        claims,
      );
      return { id: id, token: token };
    } else {
      throw new Error("error storing trust db");
    }
  }

  /**
   * Get trustID kid from passkey credential id instead of username - this feature is used during autofill
   *
   * @param credid
   * @returns
   */
  static getKidByPasskey(credid: string): string | null {
    return localStorage.getItem("trustcred-" + credid);
  }

  /**
   * This function is to index passkey credential id with trustID
   * @param credid
   * @param kid
   */

  static storeKidByPasskey(credid: string, kid: string) {
    localStorage.setItem("trustcred-" + credid, kid);
  }

  static async test() {
    let keypair = await TrustIDHelper.generateKey();
    let id = window.crypto.randomUUID();
    let encoder = new TextEncoder();
    let challenge = encoder.encode("challenge");
    let signature = await TrustIDHelper.sign(keypair, challenge);
    await TrustIDHelper.storeKeystore(id, "test", keypair);
    // verify
    let keystore = await TrustIDHelper.loadKeystore(id);
    if (keystore) {
      let pk = await window.crypto.subtle.exportKey("jwk", keypair.publicKey);
      //console.log("private: ", await window.crypto.subtle.exportKey("jwk",keystore.privateKey));
      console.log("public: ", pk);
      let result = await TrustIDHelper.verify(
        keystore.key,
        signature,
        challenge,
      );
      console.log(result);
    }
    console.log("end crypto test");
  }
}

class TrustIDHelper {
  static DEFAULT_JWT_ALG = "ES256";
  static KG_DEFAULT_ALGORITHM = {
    name: "ECDSA",
    namedCurve: "P-256",
  };
  static ES256_ALGORITHM = {
    name: "ECDSA",
    hash: { name: "SHA-256" },
  };
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
        resolve(null);
      };
      open.onsuccess = function () {
        // Start a new transaction
        var db = open.result;
        var tx = db.transaction(DB_STORE, "readwrite");
        var store = tx.objectStore(DB_STORE);
        const request = store.get(id);
        request.onsuccess = function () {
          var keystore: Keystore = request.result;
          resolve(keystore);
        };
        request.onerror = function () {
          resolve(null);
        };

        // Close the db when the transaction is done
        tx.oncomplete = function () {
          db.close();
        };
      };
    });
  }

  static async storeKeystore(
    id: string,
    username: string,
    key: CryptoKeyPair,
  ): Promise<boolean> {
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
        resolve(false);
      };
      open.onsuccess = function () {
        // Start a new transaction
        var db = open.result;
        var tx = db.transaction(DB_STORE, "readwrite");
        var store = tx.objectStore(DB_STORE);
        let keystore: Keystore = {
          id: id,
          username: username,
          key: key,
        };
        store.put(keystore);

        // Close the db when the transaction is done
        tx.oncomplete = function () {
          db.close();
          resolve(true);
        };
      };
    });
  }

  static async generateKey(): Promise<CryptoKeyPair> {
    return await window.crypto.subtle.generateKey(
      this.KG_DEFAULT_ALGORITHM,
      false,
      ["sign", "verify"],
    );
  }

  /**
   *
   * @param key CryptoKey of Trusted Device Key
   * @param payload payload needed to be signed
   */
  static async sign(
    key: CryptoKeyPair,
    payload: ArrayBuffer,
  ): Promise<ArrayBuffer> {
    return await window.crypto.subtle.sign(
      this.ES256_ALGORITHM,
      key.privateKey,
      payload,
    );
  }

  static async verify(
    key: CryptoKeyPair,
    signature: ArrayBuffer,
    challenge: ArrayBuffer,
  ): Promise<boolean> {
    return await window.crypto.subtle.verify(
      this.ES256_ALGORITHM,
      key.publicKey,
      signature,
      challenge,
    );
  }

  static async buildTrustJWT(
    keypair: CryptoKeyPair,
    header: TrustHeader,
    claims: TrustClaims,
  ): Promise<string> {
    const b64Header = stringToBase64Url(JSON.stringify(header));
    const b64Claims = stringToBase64Url(JSON.stringify(claims));
    var enc = new TextEncoder();
    const encPayload = enc.encode(b64Header + "." + b64Claims);
    const sig = await TrustIDHelper.sign(keypair, encPayload);
    const b64Sig = bufferToBase64(sig);
    const jws = b64Header + "." + b64Claims + "." + b64Sig;
    return jws;
  }
}
