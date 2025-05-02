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

import { CheckoutRequest } from "@/pages/checkout";
import { b2a } from "@/lib/encoding";

export interface BankingResult {
  token: string;
}

const loginidBaseUrl = process.env.REACT_APP_LOGINID_BASE_URL || "";
const loginidKey = process.env.REACT_APP_LOGINID_APIKEY || "";

/*
 *   This is a mocked backend service for wallet operations,
 *   intended for demo purposes only.
 */

export class WalletMockService {
  static async bankingResult(
    sessionId: string | null,
    username: string,
  ): Promise<BankingResult> {
    console.log("Processing sessionId: ", sessionId);

    // Do whatever you need to do to process the banking result

    // We then create an external auth token which will be passed to LoginID wallet SDK

    const url = loginidBaseUrl + "/fido2/v2/mgmt/grant/external-auth";
    const data = { username: username };
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${b2a(loginidKey)}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (resp.ok) {
      const tok = await resp.json();
      return tok;
    }

    throw new Error("No bank result: failed to fetch external auth token");
  }

  static async setupOrder(checkout: CheckoutRequest): Promise<string> {
    const id = window.crypto.randomUUID();
    sessionStorage.setItem(id, JSON.stringify(checkout));
    return id;
  }

  static async getOrder(id: string): Promise<CheckoutRequest | null> {
    try {
      const data = sessionStorage.getItem(id);
      if (data) {
        const order = JSON.parse(data);
        return order;
      } else {
        return null;
      }
    } catch (e) {
      console.log(e);
      return null;
    }
  }
}
