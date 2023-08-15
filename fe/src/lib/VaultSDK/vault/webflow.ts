
import Base, { Result } from "../base";
import utils from "../utils";

export interface WebflowAuthResponse  {
    url: string;
}

export interface WebflowTokenResponse {
    token: string;
    sites: WebflowSite[];
}

export interface WebflowSitesResponse {
    sites: WebflowSite[];
}

export interface WebflowSite {
    id : string;
    displayName : string;
    shortName: string;
    customDomains: WebflowDomain[]; 
}

export interface WebflowDomain {
    id : string;
    url: string;
}


export class VaultWebflow extends Base {

    async getWebflowAuthorizeUrl(): Promise<WebflowAuthResponse> {
        //const header = { "x-session-token": token };
        return await utils.http.get(
            this._baseURL,
            `/webflow/auth`,
            {},
            undefined
        );
    }

    async getWebflowSites(token: string): Promise<WebflowSitesResponse> {
        //const header = { "x-session-token": token };
        return await utils.http.post(
            this._baseURL,
            `/webflow/sites`,
            {token: token},
            undefined
        );
    }

    async getWebflowToken(code: string): Promise<WebflowTokenResponse> {
        //const header = { "x-session-token": token };
        return await utils.http.post(
            this._baseURL,
            `/webflow/token`,
            {code: code},
            undefined
        );
    }

    async uploadWebflowScript ( token : string, siteId : string, source: string) : Promise<boolean> {
        return await utils.http.post(
            this._baseURL,
            `/webflow/upload`,
            {token: token, site_id: siteId, source: source},
            undefined
        );
    }
}