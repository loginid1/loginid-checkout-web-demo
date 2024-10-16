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

import { LoginidService } from "@/services/loginid";
import { Button, Grid, Modal, Text, Card, Group, Image, Title, Container, rem, ScrollArea } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconFileDescription} from "@tabler/icons-react";
import { sha256 } from "crypto-hash";
import { useState } from "react";

export interface DocPayload {
    Type: string
    SignAt: Date
    Sha256: string
}

export function MessagePrompt() {

    const tos = `
    By creating an account (in the ABC Bank Wallet application) or by accessing the ABC Bank Wallet, you acknowledge that you have read and agree to the following statements, disclaimers, and limitation of liability. If you don’t agree, you may not use the ABC Bank Vault.  No Guarantee of Security. ABC Bank endeavors to take reasonable steps to protect your personal information. However, we cannot guarantee the security of any data you disclose online. By accessing the ABC Bank Vault, you accept the inherent security risks of providing information and dealing online over the Internet and will not hold us responsible for any breach of security.
    
    Assumption of Network Risks. You accept and acknowledge and accept the various risks inherent to using digital currency network including but not limited to hardware failure, software issues, internet connection failure, malicious software, third party interference leading to access to your Vault and other user data, unknown vulnerabilities and unanticipated changes to the protocol. You accept and acknowledge that ABC Bank will not be responsible for any communication failures, disruptions, errors, distortions or delays you may experience when using the Vault, however caused and will not be responsible for any harm occurring as a result of such risks.
    
    Assumption of Risk of Trading Digital Currencies.  You accept and acknowledge the legal risks inherent in trading digital currencies. In particular, you acknowledge and agree that the ALGO or other tokens may be considered a security under US law and elsewhere, and that if it is so considered, it may not be traded in any such jurisdiction. Any trading of the ALGO or other tokens by you in the US or elsewhere is undertaken at your sole risk. No ABC Bank Liability. We will not be responsible or liable to you for any loss and take no responsibility for and will not be liable to you for any use of the ABC Bank Vault, including but not limited to any losses, damages or claims arising from:
    
    * User error such as forgotten passwords, incorrectly constructed transactions, or mistyped addresses;
    
    * Server failure or data loss;
    
    * Corrupted ABC Bank Vault files;
    
    * Unauthorized access to applications;
    
    * Any unauthorized third party activities, including without limitation the use of viruses, phishing, brute forcing or other means of attack against the ABC Bank Vault or services;
    
    * Any enforcement action against you for illegally trading digital currencies.  <br />* Any of your activities that may be unlawful or injurious in any way to any third party.
    
    No warranty. We make no warranty that the ABC Bank Vault is free of viruses or errors, that its content is accurate, that it will be uninterrupted, or that defects will be corrected. We will not be responsible or liable to you for any loss of any kind, from action taken, or taken in reliance on material, or information, contained in the ABC Bank Vault. Right to Terminate. We may terminate your access to and use of the Services, at our sole discretion, at any time and for any reason, with or without notice to you.
    
    ABC Bank reserves the right to update the ABC Bank Vault’s disclaimer and privacy policy without notice to users.
    
    For the avoidance of doubt and purposes of emphasis, the following bolded disclaimer and limitation of liability shall apply:
    
    YOU EXPRESSLY ACKNOWLEDGE AND AGREE THAT USE OF THE VAULTIS AT YOUR SOLE RISK AND THAT THE ENTIRE RISK AS TO SATISFACTORY QUALITY, PERFORMANCE, ACCURACY AND EFFORT IS WITH YOU. THE SERVICES ARE PROVIDED ON AN “AS IS” AND “AS AVAILABLE” BASIS WITHOUT ANY REPRESENTATION OR WARRANTY, WHETHER EXPRESS, IMPLIED OR STATUTORY. TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW LOGINID SPECIFICALLY DISCLAIMS ANY EXPRESS OR IMPLIED WARRANTIES OF TITLE, MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND/OR NON-INFRINGEMENT. LOGINID DOES NOT MAKE ANY REPRESENTATIONS OR WARRANTIES THAT ACCESS TO THE VAULT OR ANY OF THE MATERIALS CONTAINED THEREIN WILL BE CONTINUOUS, UNINTERRUPTED, TIMELY, OR ERROR-FREE.
    
    LOGINID SHALL NOT BE LIABLE UNDER ANY CIRCUMSTANCES FOR ANY LOST PROFITS OR ANY SPECIAL, INCIDENTAL, INDIRECT, INTANGIBLE, OR CONSEQUENTIAL DAMAGES, WHETHER BASED IN CONTRACT, TORT, NEGLIGENCE, STRICT LIABILITY, OR OTHERWISE, ARISING OUT OF OR IN CONNECTION WITH AUTHORIZED OR UNAUTHORIZED USE OF THE VAULT, EVEN IF AN AUTHORIZED REPRESENTATIVE OF LOGINID HAS BEEN ADVISED OF OR KNEW OR SHOULD HAVE KNOWN OF THE POSSIBILITY OF SUCH DAMAGES.

    These terms of service are governed by and shall be construed in accordance with the laws of the state of Delaware, USA. Any dispute arising from the use of our ABC Bank Vault shall be governed by Delaware law and shall be submitted to the exclusive jurisdiction of the state of Delaware courts.
    `

    const docData: DocPayload = {
        Type: "text/plain",
        SignAt: new Date(),
        Sha256: ""
    }


    const [openedTos, tosHandlers] = useDisclosure(false, {onOpen: ()=>clearTos()});
    const [error, setError] = useState("");
    const [txRef, setTxRef] = useState("");


    function clearTos(){
        clear();
        setTxRef("");
    }


    async function confirmTosTranstion() {
        // clear prior result
        clear()
        try {
            const username = LoginidService.client.getCurrentUsername()
            docData.Sha256 = await sha256(tos);
            if (username) {
                const result = await LoginidService.client.confirmTransaction(username, JSON.stringify(docData))
                setTxRef(result.token);
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

            <TosDialog/>

            <Card m="xs" >

                <Card.Section p="sm">
                    <Text fw={500} c="red.7">ABC Bank Policy Update</Text>
                    <Text mt="sm">We regularly update our policies as part of our commitment to making ABC Bank the safest and most trusted experience possible. </Text>
                    <Text mt="sm">You'll have <b>at least 30 days</b> from the date of this notification to read and agree with the changes. </Text>

                    <Group justify="space-between" >
                        <IconFileDescription style={{ width: rem(64), height: rem(64) }}/>
                        <Button variant="outlined" size="sm"  onClick={tosHandlers.open}>Read</Button>
                    </Group>
                </Card.Section>
            </Card>
        </Container>
    )


    function TosDialog() {
        return (

            <Modal.Root opened={openedTos} onClose={tosHandlers.close} >
                <Modal.Overlay>
                </Modal.Overlay>
                <Modal.Content>

                    <Modal.Header bg="blue.7">
                        <Group bg="blue.7" justify="space-between" >
                            <Title c="white">Policy Update</Title>
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

                        <ScrollArea style={{whiteSpace: 'pre-wrap'}} h="360">{tos}</ScrollArea>

                        {txRef ?

                            <Grid>
                                <Grid.Col span={12} ta="center">
                                    <Button variant="subtle" onClick={tosHandlers.close}>Close</Button>
                                </Grid.Col>
                            </Grid>
                            :
                            <Group justify="space-between" mt="md" mb="xs">
                                <Button variant="subtle" onClick={tosHandlers.close}>Cancel</Button>
                                <Button onClick={confirmTosTranstion}>I Agree</Button>
                            </Group>
                        }
                    </Modal.Body>
                </Modal.Content>
            </Modal.Root>
        )
    }
}