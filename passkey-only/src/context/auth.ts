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


export class AuthContext {

    static saveDevice(email:string){
        if (typeof window !== "undefined" ){
            localStorage.setItem("trusted."+email, "true");
        }
    }

    static haveDevice(email:string) : boolean {
        if(typeof window !== "undefined" && localStorage.getItem("trusted."+email) != null) {
            return true;
        }
        return false;
    }

    static saveToken(token:string){
        if (typeof window !== "undefined" ){
            localStorage.setItem("token", token);
        }
    }  
    static signOut() {
        if (typeof window !== "undefined" ){
            localStorage.removeItem("token");
        }
    }
    
    static isLoggedIn() : boolean {
        if(typeof window !== "undefined" && localStorage.getItem("token") != null) {
            return true;
        }
        return false;
    }
}