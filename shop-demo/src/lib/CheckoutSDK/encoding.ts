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


/**
 * The `base64EncodeUrl` method converts `base64` to `base64url`
 * */
export const base64EncodeUrl = (str: string) => {
    return str
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
}

/**
 * The `btoa` method encodes a string in base-64.
 * This method uses the "A-Z", "a-z", "0-9", "+", "/" and "=" characters to encode the string.
 * */
const b2a = (a: string): string => {
    let c, d, e, f, g, h, i, j, o, b = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=", k = 0, l = 0, m = "", n = [];
    if (!a) return a;
    do {
        c = a.charCodeAt(k++);
            d = a.charCodeAt(k++);
            e = a.charCodeAt(k++);
            j = c << 16 | d << 8 | e;
            f = 63 & j >> 18;
            g = 63 & j >> 12;
            h = 63 & j >> 6;
            i = 63 & j;
            n[l++] = b.charAt(f) + b.charAt(g) + b.charAt(h) + b.charAt(i);
    } while (k < a.length);

    return m = n.join(""), o = a.length % 3, (o ? m.slice(0, o - 3) :m) + "===".slice(o || 3);
}

/**
 * The `atob` method decodes a base-64 encoded string.
 * This method decodes a string of data which has been encoded by the `btoa` method.
 * */
const a2b = (a: string): string => {
    let b, c, d, e = {} as { [index: string]: number; }, f = 0, g = 0, h = "", i = String.fromCharCode, j = a.length;
    for (b = 0; 64 > b; b++) {
        e["ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".charAt(b)] = b;
    }
    for (c = 0; j > c; c++) {
        for (b = e[a.charAt(c)], f = (f << 6) + b, g += 6; g >= 8;) {
            ((d = 255 & f >>> (g -= 8)) || j - 2 > c) && (h += i(d));
        }
    }
    return h;
}

/**
 * Convert `string` into `base64` checking if the `btoa` method
 * is available for HTML+JS implementation compatibility.
 * */
export const bufferToBase64 = (data: ArrayBuffer) => {
    let binary = "";
    const bytes = new Uint8Array(data);
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }

    const base64 = b2a(binary);
    return base64EncodeUrl(base64);
}

/**
 * Convert `base64` into `Uint8Array`
 * */
export const base64ToBuffer = (data: string): ArrayBuffer => {
    data = data.replace(/-/g, "+").replace(/_/g, "/");
    const binary = a2b(data);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }

    return bytes.buffer;
}

/**
 * Convert `base64` into `Uint8Array`
 * */
export const base64UrlToString = (data: string): ArrayBuffer => {
    data = data.replace(/-/g, "+").replace(/_/g, "/");
    const binary = a2b(data);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }

    return bytes.buffer;
}

/**
 * Along with traditional OO hierarchies, another popular way of building up classes from 
 * reusable components is to build them by combining simpler partial classes.
 * https://www.typescriptlang.org/docs/handbook/mixins.html
 * */
export const applyMixins = (derivedCtor: any, constructors: any[]) => {
    constructors.forEach((baseCtor) => {
        Object.getOwnPropertyNames(baseCtor.prototype).forEach((name) => {
            Object.defineProperty(
                derivedCtor.prototype,
                name,
                Object.getOwnPropertyDescriptor(baseCtor.prototype, name) || Object.create(null)
            );
        });
    });
}
