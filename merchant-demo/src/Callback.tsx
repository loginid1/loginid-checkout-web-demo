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

import { FormEvent, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { CheckoutResult } from "./lib/CheckoutSDK/checkout";

export function CallbackPage() {
    const currentdate = new Date().toISOString();

    const [searchParams, setSearchParams] = useSearchParams();
    
    useEffect(()=>{
        const query_data = searchParams.get("data");
        if(query_data){
            const resp : CheckoutResult = JSON.parse(query_data);
		    localStorage.setItem("preid-token", resp.email);
        }
    },[]);

    const checkout = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        window.document.location.href = "/";
    }

    return (


        <div className="flex flex-col min-h-screen bg-white md:max-w-[675px] md:ml-auto md:mr-auto">
            <div className="p-3 border-b">
                <img src="/merchant-com.png" width={200} height={32} alt="MerchantCom Logo" />
            </div>
            <div className="grow flex flex-col p-3">

                <form onSubmit={checkout}>

                    <h1 id="headerText" className="headerText  ">Thank you for shopping at Merchant.com! We have received your order.</h1>


                    <div className="flex flex-row">
                        <p className="font-bold basis-1/4 text-right p-2" > Order Number</p>
                        <p className="basis-3/4 text-left p-2" > XEREI-123451324</p>
                    </div>
                    <div className="flex flex-row">
                        <p className="font-bold basis-1/4 text-right p-2" > Order Date</p>
                        <p className="basis-3/4 text-left p-2"  > {currentdate}</p>
                    </div>

                    <p className="py-2 text-sm mt-2 text-left">
                        To view order details or make changes, go to your order status page.
                    </p>
                    <p className="py-2 text-sm text-left">
                        Your method of payment will be charged when your item(s) have shipped, or when your delivery has been scheduled.
                    </p>

                    <p className="py-2 text-sm text-left">
                        If you have a scheduled delivery for a large item, we have lots of helpful information to ensure your experience is as smooth as possible. Learn about large item delivery.
                    </p>



                    <button
                        className="button-blank text-white py-4 rounded-lg w-full mt-3 disabled:opacity-50"
                        type="submit"
                    >
                        Return To Checkout
                    </button>
                </form>
            </div>
        </div>
    );
}