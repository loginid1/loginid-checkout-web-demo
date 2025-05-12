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

import { merchantARequest } from "./merchants/merchant-a/merchantARequest";
import { merchantBRequest } from "./merchants/merchant-b/merchantBRequest";
import { merchantCRequest } from "./merchants/merchant-c/merchantCRequest";
import CheckoutSDK, { CheckoutRequest } from "./lib/checkout";
import { CheckoutA } from "./merchants/merchant-a/CheckoutA";
import { CheckoutB } from "./merchants/merchant-b/CheckoutB";
import { CheckoutC } from "./merchants/merchant-c/CheckoutC";
import { CheckoutProps } from "./merchants/types";
import { useState, useEffect, FC } from "react";

const wallet = new CheckoutSDK(
  process.env.REACT_APP_CHECKOUT_BASEURL || "",
  true,
);

type MerchantKey = "a" | "b" | "c";

const merchantTemplate = (process.env.REACT_APP_MERCHANT?.toLowerCase() ??
  "b") as MerchantKey;

const merchantMap: Record<
  MerchantKey,
  {
    CheckoutComponent: FC<CheckoutProps>;
    request: CheckoutRequest;
  }
> = {
  a: {
    CheckoutComponent: CheckoutA,
    request: merchantARequest,
  },
  b: {
    CheckoutComponent: CheckoutB,
    request: merchantBRequest,
  },
  c: {
    CheckoutComponent: CheckoutC,
    request: merchantCRequest,
  },
};

const { CheckoutComponent, request } = merchantMap[merchantTemplate];

export function CheckoutPage() {
  const [screenWidth, setScreenWidth] = useState(600);

  useEffect(() => {
    if (window) {
      setScreenWidth(window.innerWidth);
    }
  }, []);

  async function checkout() {
    try {
      const result = await wallet.checkout(request);
      console.log("Checkout result:", result);
    } catch (e) {
      console.log(e);
    }
  }

  return (
    <CheckoutComponent
      screenWidth={screenWidth}
      request={merchantARequest}
      submit={checkout}
    />
  );
}
