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

import { Footer } from "@/components/common/Footer";
import { Message, MessagingService } from "@/services/messaging";
import { Center, Card, Flex, Image } from "@mantine/core";
import { useEffect, useState } from "react";
import CheckoutLoginPrompt from "./CheckoutLoginPrompt";
import { CheckoutConfirmPrompt } from "./CheckoutConfirmPrompt";
import { useSearchParams } from "react-router-dom";
import { base64UrlToString, stringToBase64Url } from "@/lib/encoding";
import { TrustID } from "@/lib/crypto";
import { LIDService } from "@/services/loginid";
import { WalletMockService } from "@/services/backend";

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
    amount: string;
    merchant: string;
}


const mService = new MessagingService(window.parent);
export function CheckoutPage() {
    const [displayMessage, setDisplayMessage] = useState<DisplayMessage | null>(
        null
    );
    const [username, setUsername] = useState<string>("");
    const [token, setToken] = useState<string>("");
    const [view, setView] = useState<CheckoutViewEnum>(CheckoutViewEnum.Wait)
    const [searchParams, setSearchParams] = useSearchParams();
    const [webview, setWebview] = useState<boolean>(false);
    const [passkey, setPasskey] = useState<boolean>(false);
    const [order, setOrder] = useState<string>("");
    const [redirect, setRedirect] = useState<boolean>(false);
    const [payload, setPayload] = useState< CheckoutRequest | null >( null);


    useEffect(() => {
        const inIframe = window.self !== window.top;
        let target = window.parent;

        if (inIframe) {
            mService.onMessage((msg, origin) => onMessageHandle(msg, origin));
        } else {
            setRedirect(true);
        }
        
        const query_webview = searchParams.get("webview");
        if (query_webview) {
            setWebview(true);
            if (query_webview != "null") {
                setView(CheckoutViewEnum.Confirmation);
                setUsername(query_webview);
            }
        }

        loadFlow();
        //TrustID.test();

    }, []);

    async function loadFlow() {
        const query_data = searchParams.get("data");
        let apayload = null;
        if (query_data) {
            apayload = JSON.parse(base64UrlToString(query_data));
        }
        if (apayload) {
            const cId = apayload.cid;
            const oid = await WalletMockService.setupOrder(apayload);
            setOrder(oid);
            setPayload(apayload);
            const txPayload = oid;
            const result = await LIDService.client.beginFlow({ checkoutId: cId ? cId : undefined, txPayload });

            if (result.nextAction == "passkey:tx") {
                setView(CheckoutViewEnum.Confirmation);
            } else {
                // fallback
                setView(CheckoutViewEnum.Login);
            }
        }

    }


    const INTERVAL = 100;
    const TIMEOUT = 10000;
    async function waitForInput(): Promise<boolean> {
        let wait = TIMEOUT;
        while (wait > 0) {
            if (payload == null) {
                await new Promise((resolve) => setTimeout(resolve, INTERVAL));
            } else {
                return Promise.resolve(true);
            }
            wait = wait - INTERVAL;
        }
        return Promise.resolve(false);
    }

    function onMessageHandle(msg: Message, origin: string) {
        /*
        try {
            mService.origin = origin;
            mService.id = msg.id;
            let p: CheckoutRequest = JSON.parse(msg.data);
            //console.log("request: " , p);
            setUsername(p.preid);
            if (p.preid != "") {
                setView(CheckoutViewEnum.Confirmation);
            } else {
                setView(CheckoutViewEnum.Login);
            }
            payload = p;
        } catch (error) {
            console.log(error);
        }
            */
    }

    function renderView(view: CheckoutViewEnum) {
        if (view == CheckoutViewEnum.Confirmation && payload != null) {
            return <CheckoutConfirmPrompt username={username} token={token} request={payload} hasPasskey={passkey} onComplete={onCheckoutConfirmHandle} />;

        } else if (view == CheckoutViewEnum.Wait) {
            return <></>
        } else {
            return <CheckoutLoginPrompt onComplete={onCheckoutLoginHandle} />;
        }
    }

    function onCheckoutLoginHandle(email: string, token: string, next: string) {
        if (next == "passkey") {
            //localStorage.setItem("preid-email", email);
            setUsername(email);
            setToken(token);
            setPasskey(true);
            setView(CheckoutViewEnum.Confirmation);
        } else if (next == "external") {
            if (payload) {
                const data: BankingData = { id: order, merchant: payload?.merchant, amount: payload?.total };
                document.location.href = "/banking?data=" + stringToBase64Url(JSON.stringify(data));
            }
        }
    }

    function onCheckoutConfirmHandle(email: string, token: string, next: string) {
        let hasPasskey = false;
        if (next === "passkey") {
            hasPasskey = true;
        }
        console.log("Payload ", payload);
        const baseCallback = payload?.callback || `http://localhost:3001/callback`;
        const base64 = stringToBase64Url(`{"id":"${order}","passkey":${hasPasskey}}`);
        const callback = baseCallback + `?data=${base64}`;
        if (redirect) {
            if (webview) {
                const wbase64 = stringToBase64Url(`{"id":"${order}","passkey":${hasPasskey}}`);
                document.location.href = "abcbank://callback" + `?data=${wbase64}`;
            } else {
                document.location.href = callback;
            }
        } else {
            console.log("redirect back ", order, baseCallback);
            return mService.sendMessageData({ id: order, email: email, token: token, callback: baseCallback });
        }
    }

    return (
        <Center h="100vh" w="100%">
            <Card shadow="sm" w={{ base: "100%", md: 480, lg: 550 }} mih={420} p="sm">
                <Flex justify="center" align="center" direction="column" w="100%">
                    {redirect &&
                        <Image
                            h={24}
                            w={96}
                            src="/assets/logo.svg"
                            alt="LoginID Inc."
                            mb="md"
                        />
                    }
                    {renderView(view)}
                </Flex>
            </Card>
        </Center>
    );

}

