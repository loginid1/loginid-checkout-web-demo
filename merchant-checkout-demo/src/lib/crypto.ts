/*
 *   Copyright (c) 2025 LoginID Inc
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

import { bufferToBase64, stringToBase64Url } from "./encoding";

interface Keystore {
  id: string;
  key: CryptoKeyPair;
}

interface CHeader {
  kid: string;
  alg: string;
  jwk: any;
}

interface CClaims {
  sub: string;
  exp: number;
}

interface CIDResult {
  id: string;
  token: string;
  valid: boolean;
}

const DB_NAME = "CedDB";
const DB_STORE = "Keystore";

const CID_VAL = "cid-validation";
const CID_KID = "cid-kid";

export class CID {
  /**
   * Create trustID of following username
   *
   * @param username
   * @returns
   */
  static async create(): Promise<CIDResult> {
    const keyPair = await CIDHelper.generateKey();
    const id = crypto.randomUUID();

    const stored = await CIDHelper.storeKeystore(id, keyPair);
    if (!stored) throw new Error("Failed to store key in DB");

    const jwk = await crypto.subtle.exportKey("jwk", keyPair.publicKey);
    const header: CHeader = {
      kid: id,
      alg: CIDHelper.DEFAULT_JWT_ALG,
      jwk: jwk,
    };
    const claims: CClaims = {
      sub: id,
      exp: Date.now() + 5 * 60 * 1000, // 5 minutes
    };

    const token = await CIDHelper.buildCheckoutJWT(keyPair, header, claims);
    localStorage.setItem(CID_KID, id);

    return { id, token, valid: false };
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
    const keystore = await CIDHelper.loadKeystore(id);
    if (!keystore) throw new Error("Key not found in DB");

    const jwk = await crypto.subtle.exportKey("jwk", keystore.key.publicKey);
    const header: CHeader = {
      kid: id,
      alg: CIDHelper.DEFAULT_JWT_ALG,
      jwk,
    };
    const claims: CClaims = {
      sub: id,
      exp: Date.now() + 5 * 60 * 1000,
    };

    const token = await CIDHelper.buildCheckoutJWT(
      keystore.key,
      header,
      claims,
    );
    const isValid = localStorage.getItem(CID_VAL) === "true";

    return { id, token, valid: isValid };
  }

  /**
   * Marks the current identity as valid in localStorage.
   */
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
    if (!id) return CID.create();

    try {
      return await CID.sign(id);
    } catch (e) {
      console.error("Signing failed, creating new identity:", e);
      localStorage.setItem(CID_VAL, "false");
      return CID.create();
    }
  }
}

class CIDHelper {
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
   *
   * @param id device id
   * @returns Keystore | null
   */
  static async loadKeystore(id: string): Promise<Keystore | null> {
    try {
      const db = await this.openDB();
      const tx = db.transaction(DB_STORE, "readonly");
      const store = tx.objectStore(DB_STORE);
      const record = store.get(id);

      const result = await new Promise<Keystore>((resolve, reject) => {
        record.onsuccess = () => resolve(record.result);
        record.onerror = () => reject(record.error);
      });

      db.close();

      return result || null;
    } catch {
      return null;
    }
  }

  /**
   * Store the device's key pair in IndexedDB under the provided ID.
   *
   * @param id Unique identifier for the key
   * @param key Key pair to store
   * @returns True if the key was successfully stored, false otherwise
   */
  static async storeKeystore(id: string, key: CryptoKeyPair): Promise<boolean> {
    try {
      const db = await this.openDB();
      const tx = db.transaction(DB_STORE, "readwrite");

      tx.objectStore(DB_STORE).put({ id, key });

      await new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
      });

      db.close();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Generate a new ECDSA P-256 key pair for signing operations.
   *
   * @returns Newly generated CryptoKeyPair
   */
  static async generateKey(): Promise<CryptoKeyPair> {
    return await window.crypto.subtle.generateKey(
      this.KG_DEFAULT_ALGORITHM,
      false,
      ["sign"],
    );
  }

  /**
   *
   * @param key CryptoKey of Ced Device Key
   * @param payload payload needed to be signed
   */
  static async sign(
    key: CryptoKeyPair,
    payload: BufferSource,
  ): Promise<ArrayBuffer> {
    return await window.crypto.subtle.sign(
      this.ES256_ALGORITHM,
      key.privateKey,
      payload,
    );
  }

  /**
   * Construct and sign a compact Checkout ID JWT from the provided key, header, and claims.
   *
   * @param keypair Key pair used for signing
   * @param header Checkout ID JWT header containing key metadata
   * @param claims Checkout ID JWT claims containing subject and expiry
   * @returns Signed Checkout ID JWT as a string
   */
  static async buildCheckoutJWT(
    keypair: CryptoKeyPair,
    header: CHeader,
    claims: CClaims,
  ): Promise<string> {
    const b64Header = stringToBase64Url(JSON.stringify(header));
    const b64Claims = stringToBase64Url(JSON.stringify(claims));
    var enc = new TextEncoder();
    const encPayload = enc.encode(b64Header + "." + b64Claims);
    const sig = await CIDHelper.sign(keypair, encPayload);
    const b64Sig = bufferToBase64(sig);
    const jws = b64Header + "." + b64Claims + "." + b64Sig;
    return jws;
  }

  /**
   * Open (or create) an IndexedDB instance for storing keystore records.
   *
   * @returns the opened IndexedDB database
   */
  private static openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(DB_STORE)) {
          db.createObjectStore(DB_STORE, { keyPath: "id" });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
}
