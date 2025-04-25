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

import { LIDService } from "@/services/loginid";
import { Message, MessagingService } from "@/services/messaging";
import { useEffect, useState } from "react";

const mService = new MessagingService(window.parent);
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
            return mService.sendMessageData({embed:result.flow === "EMBEDDED_CONTEXT"?true:false});
        } catch (error) {
            console.log(error);
            return mService.sendMessageData({embed:false});
        }
    }
    return (
        <></>
    );
}