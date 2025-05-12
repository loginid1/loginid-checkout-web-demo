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
import { CheckoutA } from "./merchants/merchant-a/CheckoutA";
import { CheckoutB } from "./merchants/merchant-b/CheckoutB";
import { useState, useEffect } from "react";
import CheckoutSDK from "./lib/checkout";

const wallet = new CheckoutSDK(
  process.env.REACT_APP_CHECKOUT_BASEURL || "",
  true,
);

const merchantTemplate = process.env.REACT_APP_MERCHANT || "b";

export function CheckoutPage() {
  const [screenWidth, setScreenWidth] = useState(600);

  useEffect(() => {
    if (window) {
      setScreenWidth(window.innerWidth);
    }
  }, []);

  async function checkout() {
    try {
      const request =
        merchantTemplate === "a" ? merchantARequest : merchantBRequest;
      const result = await wallet.checkout(request);
      console.log("Checkout result:", result);
    } catch (e) {
      console.log(e);
    }
  }

  return merchantTemplate === "a" ? (
    <CheckoutA
      screenWidth={screenWidth}
      request={merchantARequest}
      submit={checkout}
    />
  ) : (
    <CheckoutB
      screenWidth={screenWidth}
      request={merchantBRequest}
      submit={checkout}
    />
  );
}
