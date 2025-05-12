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

import {
  CallbackA,
  ErrorA,
  merchantConfigA,
} from "./merchants/merchant-a/Callback";
import {
  CallbackB,
  ErrorB,
  merchantConfigB,
} from "./merchants/merchant-b/Callback";
import { useSearchParams } from "react-router-dom";
import { CheckoutResult } from "./lib/checkout";
import { useEffect, useState } from "react";
import { CID } from "./lib/crypto";

const merchantTemplate = process.env.REACT_APP_MERCHANT || "b";

export function CallbackPage() {
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string>("");

  const config = merchantTemplate === "a" ? merchantConfigA : merchantConfigB;
  const Callback = merchantTemplate === "a" ? CallbackA : CallbackB;
  const Error = merchantTemplate === "a" ? ErrorA : ErrorB;

  useEffect(() => {
    const queryData = searchParams.get("data");
    if (queryData) {
      const base64 = atob(queryData);
      const resp: CheckoutResult = JSON.parse(base64);

      if (resp.error) {
        setError(resp.error);
      }

      // only mark checkout ID as valid if the response is successful
      if (resp.passkey) {
        CID.setCIDValid();
      }
    }
  }, [searchParams]);

  function handleBack() {
    window.document.location.href = "/";
  }

  function RenderView() {
    if (error !== "") {
      return (
        <Error
          name={config.name}
          error={error}
          theme={config.theme}
          back={handleBack}
        />
      );
    } else {
      return (
        <Callback
          name={config.name}
          amount="127.57"
          theme={config.theme}
          back={handleBack}
        />
      );
    }
  }

  return (
    <>
      <RenderView />
    </>
  );
}
