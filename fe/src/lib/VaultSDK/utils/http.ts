import { getErrorMessageByCode, SDKError } from "./errors";

const defaultHeaders = {
    "Content-Type": "application/json"
}

/**
 *
 * */
export const post = async (server: string, endpoint: string, payload: object, headers?: any) => {
    headers = Object.assign(defaultHeaders, headers);
    const payloadJSON = {
        method: "post",
        headers: headers,
        body: JSON.stringify(payload),
    };

    const response = await fetch(server + endpoint, payloadJSON);
    const responseJSON = await response.json();
    if (response.ok) {
        return responseJSON;
    }
    const { code, message } = responseJSON;
    //throw new SDKError(code, getErrorMessageByCode(code), []);
    throw new SDKError(code, message, []);
};

export const postFormData = async (server: string, endpoint: string, payload: FormData, headers?: any) => {
    headers = Object.assign(headers);
    const payloadData = {
        method: "post",
        headers: headers,
        body: payload,
    };

    const response = await fetch(server + endpoint, payloadData);
    const responseJSON = await response.json();
    if (response.ok) {
        return responseJSON;
    }
    const { code, message } = responseJSON;
    //throw new SDKError(code, getErrorMessageByCode(code), []);
    throw new SDKError(code, message, []);
};

/**
 *
 * */
export const get = async (server: string, endpoint: string, payload?: object, headers?: any) => {
    headers = Object.assign(defaultHeaders, headers);
    const headerJSON = {
        headers: headers,
    };

    var url = server + endpoint;
    if(payload != null) {
        url = url + "?" + objToQueryString(payload);
    } 
    const response = await fetch(url, headerJSON);
    const responseJSON = await response.json();

    if (response.ok) {
        return responseJSON;
    }
    const { code, message } = responseJSON;
    //throw new SDKError(code, getErrorMessageByCode(code), []);
    throw new SDKError(code, message, []);
};

/**
 *
 * */
export const httpDelete = async (server: string, endpoint: string, headers?: any) => {
    headers = Object.assign(defaultHeaders, headers);
    const payloadJSON = {
        method: "delete",
        headers: headers,
    };

    const response = await fetch(server + endpoint, payloadJSON);
    const responseJSON = await response.json();
    if (response.ok) {
        return responseJSON;
    }
    const { code, message } = responseJSON;
    //throw new SDKError(code, getErrorMessageByCode(code), []);
    throw new SDKError(code, message, []);
};

function objToQueryString(obj: object) {
    const keyValuePairs = [];
    for (let i = 0; i < Object.keys(obj).length; i += 1) {
      keyValuePairs.push(`${encodeURIComponent(Object.keys(obj)[i])}=${encodeURIComponent(Object.values(obj)[i])}`);
    }
    return keyValuePairs.join('&');
  }
