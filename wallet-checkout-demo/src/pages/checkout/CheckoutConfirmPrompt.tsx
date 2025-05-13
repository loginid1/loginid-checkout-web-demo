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

import { KCheckoutConfirmPrompt } from "./wallets/k/CheckoutConfirmPrompt";
import { LIDService } from "@/services/loginid";
import { CheckoutRequest } from ".";
import { useState } from "react";

export interface TxPayload {
  Merchant: string;
  Subtotal: string;
  Shipping: string;
  Tax: string;
  Total: string;
  At: Date;
  Address: Address;
  Contact: string;
  Email: string;
  Note: string;
}

export interface Address {
  Street: string;
  City: string;
  State: string;
  Country: string;
  Postal: string;
}

export interface CheckoutConfirmPromptProps {
  username: string;
  token: string;
  request: CheckoutRequest;
  hasPasskey: boolean;
  redirect: boolean;
  onComplete: (email: string, token: string, next: string) => void;
}

/**
 * CheckoutConfirmPrompt
 *
 * This component displays the payment summary to the user and handles passkey-based transaction confirmation.
 *
 * Responsibilities:
 * - Displays a breakdown of the order details (shipping, contact info, total).
 * - Triggers passkey-based transaction authentication with the LoginID Wallet SDK (`performAction("passkey:tx")`).
 * - Handles both success (payload signature returned) and failure (error shown).
 *
 * Flow Summary:
 * 1. Show the user a detailed confirmation page with merchant and payment info.
 * 2. When the user clicks "Confirm", initiate passkey authentication.
 * 3. On successful signing, complete the checkout flow by passing token back to the parent.
 */
export function CheckoutConfirmPrompt(props: CheckoutConfirmPromptProps) {
  const payData: TxPayload = {
    Merchant: props.request.merchant,
    Subtotal: props.request.subtotal,
    Tax: props.request.tax,
    Shipping: props.request.shipping,
    Total: props.request.total,
    At: new Date(),
    Contact: "John Smith",
    Email: props.username,
    Address: {
      Street: "1 Front St.",
      City: "Toronto",
      State: "ON",
      Country: "Canada",
      Postal: "N3J4P8",
    },
    Note: "This payment will not be immediately reflected in your current balance.",
  };

  const [error, setError] = useState("");
  const [txRef, setTxRef] = useState("");

  async function confirmPayTranstion() {
    // clear prior result
    if (props.token !== "") {
      return props.onComplete(
        props.username,
        props.token,
        props.hasPasskey ? "passkey" : "none",
      );
    }

    clear();

    try {
      const result = await LIDService.client.performAction("passkey:tx", {
        txPayload: JSON.stringify(payData),
      });

      if (result.payloadSignature) {
        return props.onComplete(
          props.username,
          result.payloadSignature,
          "passkey",
        );
      }
    } catch (e: any) {
      setError(e.message || e.msg || e);
    }
  }

  function clear() {
    setError("");
    setTxRef("");
  }

  return (
    <KCheckoutConfirmPrompt
      payData={payData}
      error={error}
      txRef={txRef}
      onConfirm={confirmPayTranstion}
      token={props.token}
      redirect={props.redirect}
    />
  );
}
