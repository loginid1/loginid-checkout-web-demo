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

'use client';
import { LoginidService } from "@/services/loginid";
import { Center, Card, Group, Image, ActionIcon, Menu, rem, Flex, Tabs } from "@mantine/core";
import Passkeys from "./Passkeys";
import { IconUser, IconLogout, IconKey, IconMessageCircle, IconSettings, IconHome, IconMessage } from "@tabler/icons-react";
import { Footer } from "../../components/common/Footer";
import { TransactionPrompt } from "./TransactionPrompt";
import { useState } from "react";
import { MessagePrompt } from "./MessagePrompt";
import { useNavigate } from "react-router-dom";

export default function ManagePage() {

    const router = useNavigate();
    const [activeTab, setActiveTab] = useState<string | null>('home');
    const iconStyle = { width: rem(12), height: rem(12) };
    async function logout() {
        LoginidService.client.logout();
        router("/login");
    }

    return (
        <Center h="100vh" w="100%">
            <Card shadow="sm" w={{ base: 356, md: 480, lg: 500 }} mih={460} p="sm">
                <Flex justify="center" align="center" direction="column" w="100%">
                    <Group justify="space-between" align="center" mt="md" mb="xs" w="100%">

                        <Image
                            h={48}
                            w={192}

                            src="/assets/logo.svg"
                            alt="ABC Bank"
                        />

                        <Menu shadow="md" width={200}>
                            <Menu.Target>
                                <ActionIcon size="xl" radius="xl">
                                    <IconUser />
                                </ActionIcon>
                            </Menu.Target>

                            <Menu.Dropdown>
                                <Menu.Label>{LoginidService.client.getCurrentUsername()}</Menu.Label>
                                <Menu.Item onClick={() => setActiveTab("passkeys")} leftSection={<IconKey style={{ width: rem(14), height: rem(14) }} />}>
                                    Manage Passkeys
                                </Menu.Item>
                                <Menu.Item onClick={() => logout()} leftSection={<IconLogout style={{ width: rem(14), height: rem(14) }} />}>
                                    Logout
                                </Menu.Item>
                            </Menu.Dropdown>
                        </Menu>
                    </Group>

                    <Tabs value={activeTab} onChange={setActiveTab} w="100%" mb="xl">
                        <Tabs.List>
                            <Tabs.Tab value="home" leftSection={<IconHome style={iconStyle} />}>
                               Home 
                            </Tabs.Tab>
                            <Tabs.Tab value="message" leftSection={<IconMessage style={iconStyle} />}>
                                Messages
                            </Tabs.Tab>
                            <Tabs.Tab value="passkeys" leftSection={<IconKey style={iconStyle} />}>
                                Passkeys
                            </Tabs.Tab>
                        </Tabs.List>


                        <Tabs.Panel value="home">
                            <TransactionPrompt />
                        </Tabs.Panel>
                        <Tabs.Panel value="message">
                            <MessagePrompt />
                        </Tabs.Panel>

                        <Tabs.Panel value="passkeys">
                            <Passkeys />
                        </Tabs.Panel>
                    </Tabs>
                    <Footer />
                </Flex>
            </Card>
        </Center>

    );
}