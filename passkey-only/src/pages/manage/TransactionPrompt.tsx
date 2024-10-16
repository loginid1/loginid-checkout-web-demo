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

export interface TxPayload {
    Amount: string,
    From: string,
    To: string,
    At: Date,
    Note: string
}

export function TransactionPrompt() {


    const payData: TxPayload = {
        Amount: "1200.00",
        From: "CHECK1234567",
        To: "VISA4566....34444",
        At: new Date(),
        Note: "This payment will not be immediately reflected in your current balance."
    }

    const senders = ["", "jane@loginid.io", "john@loginid.io"]
    const senderAmounts = ["100.00", "200.00", "300.00", "400.00", "500.00"]
    const sendData: TxPayload = {
        Amount: "200.00",
        From: "CHECK1234567",
        To: "",
        At: new Date(),
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
        clear()
        try {
            const username = LoginidService.client.getCurrentUsername()
            if (username) {
                const result = await LoginidService.client.confirmTransaction(username, JSON.stringify(payData))
                //setTxRef((await result).txId)
            } else {
                setError("not authorized")
            }
        } catch (e: any) {
            setError(e.message || e.msg || e)
        }
    }

    async function confirmSendTranstion() {

        // clear prior result
        clear()
        // validate send
        if (sendTo === "") {
            setError("missing sender account")
            return
        }


        try {
            const username = LoginidService.client.getCurrentUsername()
            let confirmData: TxPayload = {
                Amount: sendAmount,
                From: sendData.From,
                At: sendData.At,
                To: sendTo,
                Note: sendData.Note,

            }
            if (username) {
                const result = await LoginidService.client.confirmTransaction(username, JSON.stringify(confirmData))
                setTxRef(result.credentialId)
            } else {
                setError("not authorized")
            }
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

            <PayDialog />
            <SendDialog />


            <Card m="xs" >

                <Card.Section p="sm">
                    <Text fw={500}>ABC BANK CHECKING</Text>
                    <Text>{sendData.From}</Text>
                    <Text size="xl" fw="600">$10,271.23</Text>

                    <Group justify="space-between" >
                        <IconCreditCard style={{ width: rem(64), height: rem(64) }} />
                        <Button variant="outlined" size="sm" onClick={sendHandlers.open}>Send Money</Button>
                    </Group>
                </Card.Section>
            </Card>
            <Card m="xs" >

                <Card.Section p="sm" >
                    <Text fw={500}>ABC BANK VISA</Text>
                    <Text>4566 8767 3456 3444</Text>
                    <Text size="xl" fw="600">${payData.Amount}</Text>

                    <Group justify="space-between" >
                        <Image w={64} h={48} fit="contain" src="/assets/card-art.png" ></Image>
                        <Button variant="outlined" size="sm" onClick={payHandlers.open}>Pay card</Button>
                    </Group>
                </Card.Section>
            </Card>
        </Container>
    )

    function PayDialog() {
        return (

            <Modal.Root opened={openedPay} onClose={payHandlers.close} >
                <Modal.Overlay>
                </Modal.Overlay>
                <Modal.Content>

                    <Modal.Header bg="blue.7">
                        <Group bg="blue.7" justify="space-between" >
                            <Title c="white">Pay Card</Title>
                            {txRef ?
                                <Image w={32} h={32} src="/assets/icon-2-checkmark.svg"></Image>
                                :
                                <Image w={32} h={32} src="/assets/icon-1-exclamation.svg"></Image>
                            }
                        </Group>

                    </Modal.Header>
                    <Modal.Body mt="sm">
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
                        <Grid>
                            <Grid.Col span={6} ><Text fw={700} ta="right">From Account:</Text></Grid.Col>
                            <Grid.Col span={6}>{payData.From}</Grid.Col>
                        </Grid>

                        <Grid>
                            <Grid.Col span={6} ><Text fw={700} ta="right">To Account:</Text></Grid.Col>
                            <Grid.Col span={6}>{payData.To}</Grid.Col>
                        </Grid>

                        <Grid>
                            <Grid.Col span={6} ><Text fw={700} ta="right">Amount:</Text></Grid.Col>
                            <Grid.Col span={6}>${payData.Amount}</Grid.Col>
                        </Grid>
                        <Grid>
                            <Grid.Col span={6} ><Text fw={700} ta="right">Date:</Text></Grid.Col>
                            <Grid.Col span={6}>{ParseUtil.parseDate(payData.At)}</Grid.Col>
                        </Grid>

                        <Divider mb="lg" mt="lg"></Divider>
                        <Text c="gray.7" size="sm">Note:  {payData.Note}</Text>
                        {txRef ?

                            <Grid>
                                <Grid.Col span={12} ta="center">
                                    <Button variant="subtle" onClick={payHandlers.close}>Close</Button>
                                </Grid.Col>
                            </Grid>
                            :
                            <Group justify="space-between" mt="md" mb="xs">
                                <Button variant="subtle" onClick={payHandlers.close}>Cancel</Button>
                                <Button onClick={confirmPayTranstion}>Confirm</Button>
                            </Group>
                        }
                    </Modal.Body>
                </Modal.Content>
            </Modal.Root>
        )
    }


    function SendDialog() {
        return (

            <Modal.Root opened={openedSend} onClose={sendHandlers.close} >
                <Modal.Overlay>
                </Modal.Overlay>
                <Modal.Content>

                    <Modal.Header bg="blue.7">
                        <Group bg="blue.7" justify="space-between" >
                            <Title c="white">Send Money</Title>
                            {txRef ?
                                <Image w={32} h={32} src="/assets/icon-2-checkmark.svg"></Image>
                                :
                                <Image w={32} h={32} src="/assets/icon-1-exclamation.svg"></Image>
                            }
                        </Group>

                    </Modal.Header>
                    <Modal.Body mt="sm">
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
                        <Grid>
                            <Grid.Col span={6} ><Text fw={700} ta="right">From Account:</Text></Grid.Col>
                            <Grid.Col span={6}>{sendData.From}</Grid.Col>
                        </Grid>

                        <Grid>
                            <Grid.Col span={6} ><Text fw={700} ta="right">To Account:</Text></Grid.Col>
                            <Grid.Col span={6}>

                                <NativeSelect
                                    value={sendTo}
                                    onChange={(event) => setSendTo(event.currentTarget.value)}
                                    data={senders}
                                />
                            </Grid.Col>
                        </Grid>

                        <Grid>
                            <Grid.Col span={6} ><Text fw={700} ta="right">Amount:</Text></Grid.Col>
                            <Grid.Col span={6}>

                                <NativeSelect
                                    value={sendData.Amount}
                                    onChange={(event) => setSendAmount(event.currentTarget.value)}
                                    data={senderAmounts}
                                />
                            </Grid.Col>
                        </Grid>
                        <Grid>
                            <Grid.Col span={6} ><Text fw={700} ta="right">Date:</Text></Grid.Col>
                            <Grid.Col span={6}>{ParseUtil.parseDate(sendData.At)}</Grid.Col>
                        </Grid>

                        <Divider mb="lg" mt="lg"></Divider>
                        <Text c="gray.7" size="sm">Note:  {sendData.Note}</Text>
                        {txRef ?

                            <Grid>
                                <Grid.Col span={12} ta="center">
                                    <Button variant="subtle" onClick={sendHandlers.close}>Close</Button>
                                </Grid.Col>
                            </Grid>
                            :
                            <Group justify="space-between" mt="md" mb="xs">
                                <Button variant="subtle" onClick={sendHandlers.close}>Cancel</Button>
                                <Button onClick={confirmSendTranstion}>Confirm</Button>
                            </Group>
                        }
                    </Modal.Body>
                </Modal.Content>
            </Modal.Root>
        )
    }

}