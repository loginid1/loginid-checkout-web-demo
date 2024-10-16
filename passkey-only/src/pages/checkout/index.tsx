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

export enum CheckoutViewEnum {
    Checkout = "checkout",
    Login = "login",
    Wait = "wait",
    Confirmation = "confirm",
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
}
const mService = new MessagingService(window.parent);
let payload : CheckoutRequest | null = null;
let redirect = false;
export function CheckoutPage() {
    const [displayMessage, setDisplayMessage] = useState<DisplayMessage | null>(
		null
	);
    const [username, setUsername] = useState<string>("");
    const [token, setToken] = useState<string>("");
    const [view, setView] = useState<CheckoutViewEnum>(CheckoutViewEnum.Wait)
    const [searchParams, setSearchParams] = useSearchParams();
    
    
	useEffect(() => {
        const query_data = searchParams.get("data")
        if(query_data) {
            payload = JSON.parse(query_data);
            setView(CheckoutViewEnum.Login);
            redirect = true;
        } else {

		let target = window.parent;
		if (target != null) {
			mService.onMessage((msg, origin) => onMessageHandle(msg, origin));
			//checkSession();
		} else {
			//setDisplayMessage({ text: "Missing dApp origin", type: "error" });
			//navigate("/login");
		}
        }
	}, []);

	// check if account is authorized to interac with dDapp
	async function checkSession() {
		let result = await waitForInput();
		if (result == true) {
			// check signer permission
			try {
			} catch (error) {
				console.log("txValidation error: " + error);
				mService.sendErrorMessage(
					"Invalid Transaction request: " + error
				);
				setDisplayMessage({
					text: "Invalid transaction request: " + error,
					type: "error",
				});
			}
		} else {
			mService.sendErrorMessage("Missing transaction request - timeout");
			setDisplayMessage({
				text: "Missing transaction request - timeout",
				type: "error",
			});
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
		try {
			mService.origin = origin;
			mService.id = msg.id;
			let p: CheckoutRequest = JSON.parse(msg.data);
			//console.log("request: " , p);
            setUsername(p.preid);
            if(p.preid != "") {
                setView(CheckoutViewEnum.Confirmation);
            }  else {
                setView(CheckoutViewEnum.Login);
            } 
            payload = p;
		} catch (error) {
			console.log(error);
		}
	}

    function renderView(view: CheckoutViewEnum) {
            if(view == CheckoutViewEnum.Confirmation && payload != null) {
                return <CheckoutConfirmPrompt username={username} token={token} request={payload} onComplete={onCheckoutConfirmHandle}/>;

            } else if(view == CheckoutViewEnum.Wait) {
                return <></>
            } else {
                return <CheckoutLoginPrompt onComplete={onCheckoutLoginHandle}/>;
            }
    }

    function onCheckoutLoginHandle(email: string, token: string, next: string) {
        localStorage.setItem("preid-email",email);
        setUsername(email);
        setToken(token);
        setView(CheckoutViewEnum.Confirmation);
    }

    function onCheckoutConfirmHandle(email: string, token: string, next: string) {
        localStorage.setItem("preid-email",email);
        const baseCallback = payload?.callback || `http://localhost:3001/callback`;
        const base64=btoa(`{"email":"${email}","token":"${token}","passkey":"true"}`);
        const callback = baseCallback + `?data=${base64}`;
        if(redirect) {
            document.location.href = callback;
        } else {
            return mService.sendMessageData({email:email,  token:token, callback: baseCallback });
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

