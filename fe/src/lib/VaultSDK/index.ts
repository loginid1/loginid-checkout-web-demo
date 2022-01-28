import Browser from "./browser";
import VaultAuth from "./vault";
import Base from "./base";
import { applyMixins } from "./utils/encoding";
import { VaultUser } from "./vault/user";

/**
 * Define the base class
 * */
export class VaultSDK {
    protected readonly _baseURL: string

    constructor(baseURL: string) {
        this._baseURL = baseURL;
    }
}

/**
 * Define the interface which merges the expected mixins with the same name as your base
 * */
export interface VaultSDK extends Base, Browser,  VaultAuth, VaultUser {}

/**
 * Apply the mixins into the base class via the JS at runtime
 * */
applyMixins(VaultSDK, [Base, Browser,  VaultAuth, VaultUser]);


const BASE_URL = process.env.VAULT_URL || "http://localhost:3001";
const vaultSDK = new VaultSDK(BASE_URL);
export default vaultSDK;
