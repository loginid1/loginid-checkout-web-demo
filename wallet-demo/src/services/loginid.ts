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

//import { LoginIDCognitoWebSDK } from "@loginid/cognito-web-sdk";
import { LoginIDWalletAuth } from "@loginid/checkout-wallet";

const cognitoPoolId = process.env.REACT_APP_COGNITO_POOL_ID || "";
const cognitoClientId = process.env.REACT_APP_COGNITO_CLIENT_ID || "";
const loginidBaseUrl = process.env.REACT_APP_LOGINID_BASE_URL || "";
/*
export class LoginidService {
    static client = new LoginIDCognitoWebSDK(cognitoPoolId, cognitoClientId, loginidBaseUrl);
    static AUTH_FLOW_FALLBACK = "password";
}*/

export class LIDService {
  static client = new LoginIDWalletAuth({ baseUrl: loginidBaseUrl });
}
