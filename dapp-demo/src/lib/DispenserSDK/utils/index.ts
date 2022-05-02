import { SDKError, NavigatorError, getErrorMessageByCode } from "./errors";
import { post, get } from "./http";

const errors = { SDKError, NavigatorError, getErrorMessageByCode };
const http = { post, get };

const utils = {
    errors,
    http,
}

export default utils;
