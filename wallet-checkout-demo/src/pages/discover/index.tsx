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

import { Message, MessagingService } from "@/services/messaging";
import { LIDService } from "@/services/loginid";
import { useEffect } from "react";

const mService = new MessagingService(window.parent);

/**
 * DiscoverPage
 *
 * This component handles discovery of whether the embedded checkout flow (iframe) is supported.
 *
 * Responsibilities:
 * - Listens for a discovery message from the merchant (parent) window.
 * - Calls the LoginID Wallet SDK's `discover()` method to detect the supported flow type.
 * - Replies back to the merchant with the discovery result (`embed: true` or `false`).
 *
 * Flow Summary:
 * 1. Wait for a discovery request from the merchant site via messaging.
 * 2. Perform `discover()` to check if an embedded checkout experience is possible.
 * 3. Post the result back to the merchant using window messaging.
 */
export default function DiscoverPage() {
  useEffect(() => {
    let target = window.parent;
    if (target != null) {
      mService.onMessage((msg, origin) => onMessageHandle(msg, origin));
    }
  }, []);

  async function onMessageHandle(msg: Message, origin: string) {
    try {
      mService.origin = origin;
      mService.id = msg.id;

      const result = await LIDService.client.discover();
      return mService.sendMessageData({
        embed: result.flow === "EMBEDDED_CONTEXT" ? true : false,
      });
    } catch (error) {
      console.log(error);
      return mService.sendMessageData({ embed: false });
    }
  }

  return <></>;
}
