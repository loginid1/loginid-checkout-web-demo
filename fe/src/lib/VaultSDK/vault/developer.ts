
import Base from "../base";
import utils from "../utils";
export interface AppList {
    apps: CustomVaultApp[];
}

export interface VaultApp {
    id: string;
    app_name: string;
    origins: string;
    attributes: string;
    uat: string;
}

export interface CustomVaultApp {
    id: string;
    app_name: string;
    origins: string;
    attributes: string;
    uat: string;
    user_count: string;
}

export interface AppUserConsent {
    id: string; 
    username: string;
    uat: string;
    attributes: string;
    status: string;
}

export interface AppUserList {
    users: AppUserConsent[];
    count: number;
    offset: number;
    limit: number;
}

export class VaultDeveloper extends Base {

    async getApp(token: string, app_id: string | undefined): Promise<VaultApp> {
        const header = { "x-session-token": token };
        return await utils.http.get(
            this._baseURL,
            `/api/protected/dev/getApp/${app_id}`,
            {},
            header
        );
    }

    async getAppList(token: string): Promise<AppList> {
        const header = { "x-session-token": token };
        return await utils.http.get(
            this._baseURL,
            "/api/protected/dev/getAppList",
            {},
            header
        );
    }

    async getAppUserList(token: string, app_id: string, offset: number): Promise<AppUserList> {
        const header = { "x-session-token": token };
        return await utils.http.post(
            this._baseURL,
            "/api/protected/dev/getAppUserList",
            {app_id: app_id, offset: offset},
            header
        );
    }

    async createApp(token: string, app: VaultApp): Promise<VaultApp> {
        const header = { "x-session-token": token };
        return await utils.http.post(
            this._baseURL,
            "/api/protected/dev/createApp",
            {name: app.app_name, origins: app.origins, attributes: app.attributes},
            header
        );
    }

    async updateApp(token: string, app: VaultApp): Promise<VaultApp> {
        const header = { "x-session-token": token };
        return await utils.http.post(
            this._baseURL,
            "/api/protected/dev/updateApp",
            {id: app.id, name: app.app_name, origins: app.origins, attributes: app.attributes},
            header
        );
    }

}