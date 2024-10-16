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

import ParseUtil from "@/lib/parse";
import { LoginidService } from "@/services/loginid";
import { Button, Grid, Modal, Text, Divider, Card, Group, Image, Title, Container, NativeSelect, rem } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconCreditCard } from "@tabler/icons-react";
import { useState } from "react";
import { CheckoutRequest } from ".";

export interface TxPayload {
    Merchant: string
    Subtotal: string,
    Shipping: string,
    Tax: string,
    Total: string,
    At: Date,
    Address: Address,
    Contact: string,
    Email: string,
    Note: string
}

export interface Address {
    Street: string,
    City: string,
    State: string,
    Country: string,
    Postal: string
}

export interface CheckoutConfirmPromptProps {
    username: string;
    token: string;
    request: CheckoutRequest;
    onComplete: (email: string, token: string,  next: string) => void;
}
export function CheckoutConfirmPrompt(props: CheckoutConfirmPromptProps) {


    const payData: TxPayload = {
        Merchant: props.request.merchant,
        Subtotal: props.request.subtotal,
        Tax: props.request.tax,
        Shipping: props.request.shipping,
        Total: props.request.total,
        At: new Date(),
        Contact: "John Smith",
        Email: props.username,
        Address: {
            Street: "1 Front St.",
            City: "Toronto",
            State: "ON",
            Country: "Canada",
            Postal: "N3J4P8"
        },
        Note: "This payment will not be immediately reflected in your current balance."
    }


    const [openedPay, payHandlers] = useDisclosure(false, { onOpen: () => clearPay() });
    const [openedSend, sendHandlers] = useDisclosure(false, { onOpen: () => clearSend() });
    const [error, setError] = useState("");
    const [txRef, setTxRef] = useState("");

    const [sendAmount, setSendAmount] = useState("");
    const [sendTo, setSendTo] = useState("");


    function clearPay() {
        clear();
        setTxRef("");
    }

    function clearSend() {
        clear();
        setTxRef("");
        setSendTo("");
    }

    async function confirmPayTranstion() {
        // clear prior result
        if(props.token != "") {
            return props.onComplete(props.username, props.token, "checkout");
        }
        clear()
        try {
            console.log(props.username);
                const result = await LoginidService.client.confirmTransaction(props.username, JSON.stringify(payData))
                setTxRef(result.token)
                return props.onComplete(props.username, result.token, "checkout");
        } catch (e: any) {
            setError(e.message || e.msg || e)
        }
    }


    function clear() {
        setError("")
        setTxRef("")

    }


    return (


        <Container w="100%" >

            {/**
             * 
            <Group bg="blue.7" justify="space-between" >
                <Title c="white">Pay Card</Title>
                {txRef ?
                    <Image w={32} h={32} src="/assets/icon-2-checkmark.svg"></Image>
                    :
                    <Image w={32} h={32} src="/assets/icon-1-exclamation.svg"></Image>
                }
            </Group>
             */}

            {txRef &&
                <>
                    <Grid>
                        <Grid.Col span={12} ta="center">
                            <Text c="green.5">Transaction Successfull</Text>
                        </Grid.Col>
                    </Grid>
                </>
            }
            {error && <Text c="red.5">{error}</Text>}
            <Grid >
                <Grid.Col span={4} style={{alignItems:"flex-end"}} ><Image  h={36} w={64} src="/assets/my-bank.png" /></Grid.Col>
                <Grid.Col span={8}>
                    <Text size="sm" ta="left">
                        My Bank Rewards<br />
                        ******5465
                    </Text>
                </Grid.Col>
            </Grid>
            <Divider mb="xs" mt="xs"></Divider>
            <Grid>
                <Grid.Col span={4} ><Text fw={700} ta="right" size="sm">SHIPPING</Text></Grid.Col>
                <Grid.Col span={8}>
                    <Text size="sm" ta="left">
                        {payData.Address.Street}<br />
                        {payData.Address.City} , {payData.Address.State}<br />
                        {payData.Address.Country} {payData.Address.Postal}
                    </Text>
                </Grid.Col>
            </Grid>
            <Divider mb="xs" mt="xs"></Divider>
            <Grid>
                <Grid.Col span={4} ><Text fw={700} ta="right" size="sm">CONTACT</Text></Grid.Col>
                <Grid.Col span={8}>
                    <Text size="sm" ta="left">
                        {payData.Contact}<br />
                        {payData.Email} <br />
                    </Text>
                </Grid.Col>
            </Grid>
            <Divider mb="xs" mt="xs"></Divider>

            <Grid mt={0}>
                <Grid.Col span={8} ><Text fw={500} ta="right" size="xs">SUBTOTAL</Text></Grid.Col>
                <Grid.Col span={4}><Text size="xs" ta="left">{payData.Subtotal} </Text></Grid.Col>
            </Grid>
            <Grid mt={0}>
                <Grid.Col span={8} ><Text fw={500} ta="right" size="xs">SHIPPING</Text></Grid.Col>
                <Grid.Col span={4}><Text size="xs" ta="left">{payData.Shipping} </Text></Grid.Col>
            </Grid>
            <Grid mt={0}>
                <Grid.Col span={8} ><Text fw={500} ta="right" size="xs">TAX</Text></Grid.Col>
                <Grid.Col span={4}><Text size="xs" ta="left">{payData.Tax} </Text></Grid.Col>
            </Grid>
            <Grid>
                <Grid.Col span={8} ><Text fw={700} ta="right">PAY {payData.Merchant} </Text></Grid.Col>
                <Grid.Col span={4} ta="left">${payData.Total}</Grid.Col>
            </Grid>

            <Divider mb="xs" mt="xs"></Divider>
                    <Button onClick={confirmPayTranstion}>Confirm</Button>


        </Container>
    )


}