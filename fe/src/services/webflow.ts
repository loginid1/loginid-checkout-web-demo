import { WebflowSite } from "../lib/VaultSDK/vault/webflow";

export interface WebflowSession {
	token: string;
}

export class WebflowService {
	static storeToken(token: string) {
		localStorage.setItem("webflow-token", token);
	}

	static getToken(): string | null {
		return localStorage.getItem("webflow-token");
	}

	static storeSites(sites: WebflowSite[]) {
		localStorage.setItem("webflow-sites", JSON.stringify(sites));
	}

	static getSites(): WebflowSite[] {
		const sitesStr = localStorage.getItem("webflow-sites");
		if (sitesStr) {
			return JSON.parse(sitesStr);
		} else {
			return [];
		}
	}

    static saveNavigation (url : string){
        localStorage.setItem("webflow-savepoint", url);
    }

    static getNavigation(): string {
        const savePoint = localStorage.getItem("webflow-savepoint");
        if ( savePoint == null ){
            return "/developer/register";
        } else {
            return savePoint;
        }
    }
}
