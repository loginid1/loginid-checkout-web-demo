import { Center, Card, Flex, Image } from "@mantine/core";
import { redirect, useSearchParams } from "react-router-dom";
import { CheckoutRequest, CheckoutViewEnum } from "..";
import { AddPasskey } from "@/components/common/AddPasskey";
import { useEffect, useState } from "react";
import { WalletMockService } from "@/services/backend";
import { LIDService } from "@/services/loginid";
import ParseUtil from "@/lib/parse";
import { stringToBase64Url } from "@/lib/encoding";

export interface BankingRes{
    id: string;
    username: string;
}

export function CheckoutExternalPage(){

    const [username, setUsername] = useState<string>("");
    const [searchParams, setSearchParams] = useSearchParams();
    const [order, setOrder] = useState<CheckoutRequest | null>(null);
    const [id, setId] = useState<string>("");


    useEffect(() => { 
        confirmExternal();
    },[]);
    async function confirmExternal(){

        const bankingSession = searchParams.get("session");
        const bResult : BankingRes | null = ParseUtil.parseB64Data(bankingSession);
        if(bResult == null ) {
            console.log("no banking result")
            return;
        }
        // get user confirmation from external system
        try {

            const bresult = await WalletMockService.bankingResult(bResult.id, bResult.username);
            setUsername(bResult.username);
            // confirm external with loginID
            const result = await LIDService.client.performAction("external", {payload:bresult.token});
            const sorder = await WalletMockService.getOrder(bResult.id);
            if(!sorder){
                // unknown order error
                return
            }
            setOrder(sorder);
            setId(bResult.id);

            // set passkey
            if (result.nextAction == "passkey:reg") {
                // allow passkey registration
                
            } else {
                // redirect to merchan as fail
                const baseCallback = sorder.callback || `http://localhost:3001/callback`;
                document.location.href = baseCallback + "?data="+ParseUtil.consertJSONToB64({error:"unconfirmed purchase"});

            }

        } catch (e) {
            // redirect back with error
            console.log("error: ", e)
        }
        // confirm external with loginID
    }

    function renderView(view: CheckoutViewEnum) {
        if (view == CheckoutViewEnum.AddPasskey) {
            return <AddPasskey username={username}  onComplete={onAddPasskeyHandle} />;

        } else {
            return <></>
        }
    }
     
    async function onAddPasskeyHandle(success:boolean){
        if(success) {
            // return to merchant with passkey
            const baseCallback = order?.callback || `http://localhost:3001/callback`;
            const base64 = stringToBase64Url(`{"id":"${id}","passkey":true}`);
            const callback = baseCallback + `?data=${base64}`;
            document.location.href = callback;
        } else {
            // return to merchant without passkey
            const baseCallback = order?.callback || `http://localhost:3001/callback`;
            const base64 = stringToBase64Url(`{"id":"${id}","passkey":false}`);
            const callback = baseCallback + `?data=${base64}`;
            document.location.href = callback;
        }

    }

    return (
        <Center h="100vh" w="100%">
            <Card shadow="sm" w={{ base: "100%", md: 480, lg: 550 }} mih={420} p="sm">
                <Flex justify="center" align="center" direction="column" w="100%">
                        <Image
                            h={24}
                            w={96}
                            src="/assets/logo.svg"
                            alt="LoginID Inc."
                            mb="md"
                        />
                    {renderView(CheckoutViewEnum.AddPasskey)}
                </Flex>
            </Card>
        </Center>
    );
}