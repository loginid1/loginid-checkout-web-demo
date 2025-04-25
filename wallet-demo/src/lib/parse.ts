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

import { base64UrlToString, stringToBase64Url } from "./encoding";

const dateTimeFormat = new Intl.DateTimeFormat("en", {
    month: "numeric",
    year: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
});

const dateFormat = new Intl.DateTimeFormat("en", {
    month: "numeric",
    year: "numeric",
    day: "numeric",
});


export interface IDToken {
    sub: string;
    aud: string;
    username: string;
}

export default class ParseUtil {

    static parseDateTime(time: string): string {
        return dateTimeFormat.format(Date.parse(time));
    }

    static parseDateTimeUnix(time: number): string {
        return dateTimeFormat.format(new Date(time * 1000));
    }


    static parseDateUnix(time: number): string {
        return dateFormat.format(new Date(time * 1000));
    }

    static parseDate(time: Date): string {
        return dateFormat.format(time);
    }

    static parseToken(token: string): any {
        var base64Url = token.split(".")[1];
        var base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        var jsonPayload = decodeURIComponent(
            window
                .atob(base64)
                .split("")
                .map(function (c) {
                    return (
                        "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2)
                    );
                })
                .join("")
        );

        return JSON.parse(jsonPayload);
    }

    static isWebview(): boolean {

        const navigator: any = window.navigator;
        const userAgent = navigator.userAgent;
        const normalizedUserAgent = userAgent.toLowerCase();

        const isIos = /ip(ad|hone|od)/.test(normalizedUserAgent) || navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
        const isAndroid = /android/.test(normalizedUserAgent);
        const isSafari = /safari/.test(normalizedUserAgent);
        // ios only
        let standalone = false;
        if (isIos) {
            standalone = navigator.standalone;
        }
        const isWebview = (isAndroid && /; wv\)/.test(normalizedUserAgent)) || (isIos && !standalone && !isSafari);
        return isWebview;
    }
    static isIPhone(): boolean {

        const navigator: any = window.navigator;
        const userAgent = navigator.userAgent;
        const normalizedUserAgent = userAgent.toLowerCase();
        const isIphone = /iphone/.test(normalizedUserAgent) || navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
        return isIphone;
    }

    static parseB64Data<T>(data: string | null ): T | null {
        if(!data){
            return null;
        }
        try {
            const decode_data = base64UrlToString(data);
            return JSON.parse(decode_data);
        } catch(e) {
            return null;
        }
    }
    static  consertJSONToB64<T>(json: T ) : string | null {
        try {
            return stringToBase64Url(JSON.stringify(json));
        } catch (e) {
            return null;
        }
    }
}