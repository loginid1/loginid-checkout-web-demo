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

import { Center, Card, Flex, Image } from "@mantine/core";
import { WalletMockService } from "@/services/backend";
import { CheckoutRequest, CheckoutViewEnum } from "..";
import { AddPasskey } from "../wallets/k/AddPasskey";
import { useSearchParams } from "react-router-dom";
import { stringToBase64Url } from "@/lib/encoding";
import { LIDService } from "@/services/loginid";
import { useEffect, useState } from "react";
import { CALLBACK_URL } from "@/lib/urls";
import ParseUtil from "@/lib/parse";

export interface BankingRes {
  id: string;
  username: string;
}

/**
 * CheckoutExternalPage
 *
 * This component handles post-bank-login external authentication flow for LoginID Checkout.
 *
 * Responsibilities:
 * - Confirms the external (bank) authentication session by validating the banking result token.
 * - Performs external authentication with LoginID Wallet SDK (`performAction("external", { payload })`).
 * - If successful, prompts the user to register a passkey (via the `AddPasskey` component).
 * - Redirects back to merchant domain after passkey creation or error.
 *
 * Flow Summary:
 * 1. Parse the bank login session from query parameters.
 * 2. Fetch and confirm external authentication result via `WalletMockService` and LoginID SDK.
 * 3. Depending on nextAction, either allow passkey registration or return with an error.
 * 4. After user registers a passkey (or skips), redirect back to the merchant.
 */
export function CheckoutExternalPage() {
  const [order, setOrder] = useState<CheckoutRequest | null>(null);
  const [username, setUsername] = useState<string>("");
  const [searchParams] = useSearchParams();
  const [id, setId] = useState<string>("");

  useEffect(() => {
    confirmExternal();
  }, []);

  async function confirmExternal() {
    const bankingSession = searchParams.get("session");
    const sessionData: BankingRes | null =
      ParseUtil.parseB64Data(bankingSession);

    // No banking result
    if (sessionData === null) {
      console.log("no banking result");
      return;
    }

    // Get user confirmation from external system
    try {
      const bankingResult = await WalletMockService.bankingResult(
        sessionData.id,
        sessionData.username,
      );

      setUsername(sessionData.username);

      // Confirm external with loginID
      const lidResult = await LIDService.client.performAction("external", {
        payload: bankingResult.token,
      });

      const order = await WalletMockService.getOrder(sessionData.id);
      if (!order) {
        console.error("Order not found for ID:", sessionData.id);
        // Unknown order error
        return;
      }

      setOrder(order);
      setId(sessionData.id);

      if (lidResult.nextAction !== "passkey:reg") {
        redirectToMerchantWithError(order.callback, "unconfirmed purchase");
      }

      // Else allow passkey registration
    } catch (e) {
      // Redirect back with error
      console.error("Error during external confirmation:", e);
    }
    // Confirm external with loginID
  }

  function redirectToMerchantWithError(errorMsg: string, callbackUrl?: string) {
    const baseCallback = callbackUrl || CALLBACK_URL;
    const errorPayload = ParseUtil.consertJSONToB64({ error: errorMsg });
    window.location.href = `${baseCallback}?data=${errorPayload}`;
  }

  function renderView(view: CheckoutViewEnum) {
    if (view === CheckoutViewEnum.AddPasskey) {
      return <AddPasskey username={username} onComplete={onAddPasskeyHandle} />;
    } else {
      return <></>;
    }
  }

  async function onAddPasskeyHandle(success: boolean) {
    const baseCallback = order?.callback || CALLBACK_URL;
    const payload = { id, passkey: success };
    const encodedPayload = stringToBase64Url(JSON.stringify(payload));
    const redirectUrl = `${baseCallback}?data=${encodedPayload}`;

    window.location.href = redirectUrl;
  }

  return renderView(CheckoutViewEnum.AddPasskey);
}
