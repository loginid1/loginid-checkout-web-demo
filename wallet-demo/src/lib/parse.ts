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

import { base64UrlToString, stringToBase64Url } from "./encoding";

export interface IDToken {
  sub: string;
  aud: string;
  username: string;
}

export default class ParseUtil {
  static parseToken(token: string): any {
    var base64Url = token.split(".")[1];
    var base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    var jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split("")
        .map(function (c) {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join(""),
    );

    return JSON.parse(jsonPayload);
  }

  static isIPhone(): boolean {
    const navigator: any = window.navigator;
    const userAgent = navigator.userAgent;
    const normalizedUserAgent = userAgent.toLowerCase();
    const isIphone =
      /iphone/.test(normalizedUserAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    return isIphone;
  }

  static parseB64Data<T>(data: string | null): T | null {
    if (!data) {
      return null;
    }
    try {
      const decode_data = base64UrlToString(data);
      return JSON.parse(decode_data);
    } catch (e) {
      return null;
    }
  }

  static consertJSONToB64<T>(json: T): string | null {
    try {
      return stringToBase64Url(JSON.stringify(json));
    } catch (e) {
      return null;
    }
  }
}
