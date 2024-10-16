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

import { Message, MessagingService } from "@/services/messaging";
import { useEffect, useState } from "react";

const mService = new MessagingService(window.parent);
export default function IDVPage() {
    const [preID, setPreID] = useState("");
    useEffect(() => {
        let target = window.parent;
        if (target != null) {
            mService.onMessage((msg, origin) => onMessageHandle(msg, origin));
        }
        getCookie();
    }, []);

    function getCookie(){
        const id = window.localStorage.getItem("preid-email");
        if(id) {
            setPreID(id);
        }

    }

    function onMessageHandle(msg: Message, origin: string) {
        try {
            mService.origin = origin;
            mService.id = msg.id;
            const id = window.localStorage.getItem("preid-email");
            if (id) {
                setPreID(id);
                return mService.sendMessageData({token:id});
            } else {
                return mService.sendMessageData({token:""});
            }
        } catch (error) {
            console.log(error);
            return mService.sendMessageData({token:""});
        }
    }
    return (
        <></>
    );
}