import { base64EncodeUrl, base64ToBuffer, bufferToBase64 } from "./encoding";
import { SDKError, NavigatorError, getErrorMessageByCode } from "./errors";
import { post, get, httpDelete } from "./http";
import { getCredential, createCredential, convertCredentialDescriptor } from "./navigator";
import { authidIframeHandler } from "./authid";

const encoding = { base64EncodeUrl, base64ToBuffer, bufferToBase64 };
const errors = { SDKError, NavigatorError, getErrorMessageByCode };
const http = { post, get, httpDelete };
const navigator = { getCredential, createCredential, convertCredentialDescriptor };

const utils = {
    encoding,
    errors,
    http,
    navigator,
    authidIframeHandler
}

export default utils;
