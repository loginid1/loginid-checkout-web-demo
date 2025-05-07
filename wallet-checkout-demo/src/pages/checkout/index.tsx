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

import { base64UrlToString, stringToBase64Url } from "@/lib/encoding";
import { Message, MessagingService } from "@/services/messaging";
import { CheckoutConfirmPrompt } from "./CheckoutConfirmPrompt";
import { Center, Card, Flex, Image } from "@mantine/core";
import CheckoutLoginPrompt from "./CheckoutLoginPrompt";
import { WalletMockService } from "@/services/backend";
import { CALLBACK_URL, WEBVIEW_URL } from "@/lib/urls";
import { useSearchParams } from "react-router-dom";
import { LIDService } from "@/services/loginid";
import { useEffect, useState } from "react";

export enum CheckoutViewEnum {
  Checkout = "checkout",
  Login = "login",
  Wait = "wait",
  Confirmation = "confirm",
  AddPasskey = "add-passkey",
}

export interface DisplayMessage {
  text: string;
  type: string;
}

export interface CheckoutRequest {
  merchant: string;
  preid: string;
  subtotal: string;
  shipping: string;
  tax: string;
  total: string;
  desc: string;
  callback: string;
  cid: string;
}

export interface BankingData {
  id: string;
  bank: string;
  amount: string;
  merchant: string;
}

const mService = new MessagingService(window.parent);

/**
 * CheckoutPage
 *
 * This component manages the wallet-side flow for LoginID Checkout.
 *
 * Responsibilities:
 * - Listens for messages from the merchant site (in iframe mode) or redirects in webview mode
 * - Loads the user's checkout payload and begins Wallet SDK's `beginFlow` to determine next action
 * - Displays fallback login (bank sign-in, autofill) or transaction confirmation based on passkey availability
 * - Handles communication back to merchant (via message passing or URL redirects) after checkout completes
 *
 * Flow Summary:
 * 1. Load order and determine checkout context (webview or iframe).
 * 2. Use Wallet SDK (`beginFlow`) to decide if user can approve with passkey or needs to fallback login.
 * 3. After user login/approval, send the result back to merchant domain.
 *
 * Related:
 * - `WalletMockService` is used to simulate backend order creation for demo.
 * - `LIDService` wraps the LoginID Wallet SDK client used for authentication and transaction signing.
 */
export function CheckoutPage() {
  const [username, setUsername] = useState<string>("");
  const [token, setToken] = useState<string>("");
  const [view, setView] = useState<CheckoutViewEnum>(CheckoutViewEnum.Wait);
  const [searchParams] = useSearchParams();
  const [webview, setWebview] = useState<boolean>(false);
  const [passkey, setPasskey] = useState<boolean>(false);
  const [order, setOrder] = useState<string>("");
  const [redirect, setRedirect] = useState<boolean>(false);
  const [payload, setPayload] = useState<CheckoutRequest | null>(null);

  useEffect(() => {
    const inIframe = window.self !== window.top;

    if (inIframe) {
      mService.onMessage((msg, origin) => onMessageHandle(msg, origin));
    } else {
      setRedirect(true);
    }

    const query_webview = searchParams.get("webview");
    if (query_webview) {
      setWebview(true);
      if (query_webview !== "null") {
        setView(CheckoutViewEnum.Confirmation);
        setUsername(query_webview);
      }
    }

    loadOrder();
  }, [searchParams]);

  async function loadOrder() {
    const queryData = searchParams.get("data");
    let apayload = null;

    if (queryData) {
      apayload = JSON.parse(base64UrlToString(queryData));
    }

    if (apayload) {
      const checkoutId = apayload.cid;
      const orderId = await WalletMockService.setupOrder(apayload);

      setOrder(orderId);
      setPayload(apayload);

      const txPayload = orderId;
      const result = await LIDService.client.beginFlow({
        checkoutId: checkoutId,
        txPayload,
      });

      if (result.nextAction === "passkey:tx") {
        setView(CheckoutViewEnum.Confirmation);
      } else {
        // fallback
        setView(CheckoutViewEnum.Login);
      }
    }
  }

  function onMessageHandle(msg: Message, origin: string) { }

  function renderView(view: CheckoutViewEnum) {
    if (view === CheckoutViewEnum.Confirmation && payload != null) {
      return (
        <CheckoutConfirmPrompt
          username={username}
          token={token}
          request={payload}
          hasPasskey={passkey}
          onComplete={onCheckoutConfirmHandle}
        />
      );
    } else if (view === CheckoutViewEnum.Wait) {
      return <></>;
    } else {
      return <CheckoutLoginPrompt onComplete={onCheckoutLoginHandle} onExternal={onExternalHandle} />;
    }
  }

  function onCheckoutLoginHandle(email: string, token: string, next: string) {
    // Display passkey authentication with autofill
    if (next === "passkey") {
      setUsername(email);
      setToken(token);
      setPasskey(true);
      setView(CheckoutViewEnum.Confirmation);
    }
  }

  function onExternalHandle(bank: string) {
    if (payload) {
      const data: BankingData = {
        id: order,
        bank: bank,
        merchant: payload?.merchant,
        amount: payload?.total,
      };

      document.location.href =
        "/banking?data=" + stringToBase64Url(JSON.stringify(data));
    }

  }

  function onCheckoutConfirmHandle(email: string, token: string, next: string) {
    const hasPasskey = next === "passkey";
    const orderData = { id: order, passkey: hasPasskey };

    const baseCallback = payload?.callback || CALLBACK_URL;
    const encodedData = stringToBase64Url(JSON.stringify(orderData));
    const callbackUrl = `${baseCallback}?data=${encodedData}`;

    if (!redirect) {
      return mService.sendMessageData({
        id: order,
        email: email,
        token: token,
        callback: baseCallback,
      });
    }

    if (webview) {
      const webviewCallback = WEBVIEW_URL;
      const webviewData = stringToBase64Url(JSON.stringify(orderData));
      document.location.href = `${webviewCallback}?data=${webviewData}`;
    } else {
      document.location.href = callbackUrl;
    }
  }

  return (
    <Center h="100vh" w="100%">
      <Card shadow="sm" w={{ base: "100%", md: 480, lg: 550 }} mih={420} p="sm">
        <Flex justify="center" align="center" direction="column" w="100%">
          {redirect && (
            <Image
              h={24}
              w={96}
              src="/assets/logo.svg"
              alt="LoginID Inc."
              mb="md"
            />
          )}
          {renderView(view)}
        </Flex>
      </Card>
    </Center>
  );
}
