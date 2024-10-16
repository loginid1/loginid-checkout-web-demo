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

import jwtDecode from "jwt-decode";

export interface UserSession {
    username : string | null;
    token : string | null;
}

export interface UserPreference {
    username: string;
    scopes?: string;
}

export interface Claims {
    sub: string;
    scopes: string;
    iat: number;
    aud: string;
}
export class AuthService {

    static storePref(pref : UserPreference) {
        localStorage.setItem("pref",JSON.stringify(pref));
    }

    static storeSession(user : UserSession ) {
        localStorage.setItem("session", JSON.stringify(user) )
        //parse token and store pref
        if (user!=null && user.token != null && user.username!= null ){
            let claims : Claims = jwtDecode(user.token);
            this.storePref({username: user.username, scopes: claims.scopes});
        }

    }

    static logout() {
        localStorage.removeItem("session");
    }  

    static getSession() : UserSession | null  {
        const userStr = localStorage.getItem("session");
        if (userStr) return JSON.parse(userStr);
        return null;
    }

    static getPref() : UserPreference | null  {
        const userStr = localStorage.getItem("pref");
        if (userStr) return JSON.parse(userStr);
        return null;
    }

    static getToken() : string | null {
        const session = this.getSession();
        if(session) return session.token;
        return null;    
    }

    static getUsername() : string | null  {
        const userStr = localStorage.getItem("session");
        if (userStr) return JSON.parse(userStr).username;
        return null;
    }
    static isLoggedIn() : boolean {
        if(AuthService.getSession() != null) {
            return true;
        } else {
            return false;
        }
    }

    static hasAccount() : boolean {
        if(AuthService.getPref() != null) {
            return true;
        } else {
            return false;
        }
    }
}