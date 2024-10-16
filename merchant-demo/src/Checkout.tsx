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

import { useState, useEffect } from "react";
import { BuildingStorefrontIcon, TruckIcon } from "@heroicons/react/24/outline";
import CheckoutSDK, { CheckoutRequest } from "./lib/CheckoutSDK/checkout";

const wallet = new CheckoutSDK(process.env.REACT_APP_CHECKOUT_BASEURL || '', true, "checkout")
export function CheckoutPage() {
    const [screenwidth, setScreenWidth] = useState(600);
    const [username, setUsername] = useState<string>('');
    const [preid, setPreid] = useState<string>("");
    useEffect(() => {
        if (window) {
            setScreenWidth(window.innerWidth);
            console.log(window.innerWidth);
        }
        getPreID();
    }, []);



    const getPreID = async () => {
        const id = await wallet.preID();
        setPreid(id.token);
    }
    async function checkout() {
        try {
            const callback_url = window.location.origin + "/callback";
            const request: CheckoutRequest = {
                merchant: process.env.REACT_APP_MERCHANT || "Merchant",
                preid: preid,
                subtotal: "100.00",
                tax: "0.00",
                total: "100.00",
                shipping: "20.00",
                desc: "item",
                callback: callback_url,
            }
            const result = await wallet.checkout(request);
            console.log("checkout result: ", result);

        } catch (e) {
            console.log(e);
        }

    }

    return (<>

        <div className="flex flex-col min-h-screen bg-white md:max-w-[675px] md:ml-auto md:mr-auto">
            <div className="p-3 border-b">
                <img src="/merchant-com.png" width={200} height={32} alt="MerchantCom Logo" />
            </div>
            <div className="grow flex flex-col p-3">

                <div className="flex flex-col md:flex-row justify-between items-center mb-4">
                </div>


                <div className="flex flex-row">
                    <div className="basis-1/4 font-bold m-1">Subtotal:</div>
                    <div className="m-1">$100.00</div>
                </div>
                <div className="flex flex-row">
                    <div className="basis-1/4 font-bold m-1">Shipping:</div>
                    <div className="m-1">$20.00</div>
                </div>
                <div className="flex flex-row">
                    <div className="basis-1/4 font-bold m-1">Tax:</div>
                    <div className="m-1">$0</div>
                </div>
                <hr className="solid w-full m-2"></hr>
                <div className="flex flex-row">
                    <div className="basis-1/4 font-bold m-1">Total:</div>
                    <div className="m-1">$120.00</div>
                </div>

                <p className="text-l mt-8 mb-3">Delivery method</p>

                <div className="px-3 border rounded-lg">
                    <label className="flex gap-3 items-center py-3 border-b">
                        <input type="radio" name="ship" value="ship" defaultChecked={true} />
                        <TruckIcon className="h-5 w-5" /> Ship
                    </label>

                    <label className="flex gap-3 items-center py-3">
                        <input type="radio" name="ship" value="ship" />
                        <BuildingStorefrontIcon className="h-5 w-5" /> Local Portland, OR Pickup: Thursdays only, 10am - 4pm
                    </label>
                </div>

                {screenwidth > 768 &&
                    <>
                <p className="text-l mt-8 mb-3">Shipping address</p>

                <div className="flex align-center rounded-lg border py-4 px-3">
                    <select className="w-full">
                        <option defaultValue={'United States'}>United States</option>
                    </select>
                </div>

                        <input
                            className="flex align-center rounded-lg border py-2 px-3 w-full mt-3"
                            type="text"
                            name="firstname"
                            defaultValue={'John'}
                            placeholder="First name"
                        />

                        <input
                            className="flex align-center rounded-lg border py-2 px-3 w-full mt-3"
                            type="text"
                            name="lastname"
                            defaultValue={'Smith'}
                            placeholder="Last name"
                        />
                    </>
                }

                <div className="mt-2">
                    <button
                        className="button-blank text-white rounded-lg w-full "
                        onClick={e => checkout()}
                    >
                        <img src="/logo.svg" className="align-center" alt="Checkout" width="80" height="24" />
                    </button>
                </div>
            </div>
        </div>
    </>);
}

function CheckoutComp() {

}