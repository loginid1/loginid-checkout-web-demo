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
import { Center, Card, Flex, Image } from "@mantine/core";
import { useState } from "react";
import { AddPasskey } from "../../components/common/AddPasskey";
import { Footer } from "../../components/common/Footer";
import SignupPromptPassword from "./SignupPromptPassword";
import { useNavigate } from "react-router-dom";

export enum SignupViewEnum {
    EmailConfirmation = "email-confirmation",
    SignupPrompt = "signup-prompt",
    AddPasskey = "add-passkey",
    Home = "home"
}

export default function SignupPage() {

    const [view, setView] = useState<SignupViewEnum>(SignupViewEnum.SignupPrompt);
    const [email, setEmail] = useState("");
    const router = useNavigate();

    function renderView(view: SignupViewEnum) {
        if (view === SignupViewEnum.SignupPrompt) {
            return <SignupPromptPassword onComplete={onSignupPromptComplete} />
        } else if (view === SignupViewEnum.AddPasskey) {
            return <AddPasskey onComplete={onAddPasskeyComplete} email={email} />
        }
    }

    function onSignupPromptComplete(email: string, next: string) {
        // send email and switch view
        setEmail(email);
        if (next === "passkey") {
            setView(SignupViewEnum.AddPasskey);
        }

    }


    function onAddPasskeyComplete(success: boolean) {
        router("/manage");
    }

    return (
        <Center h="100vh" w="100%">
            <Card shadow="sm" w={{ base: 356, md: 480, lg: 550 }} mih={460} p="sm">
                <Flex justify="center" align="center" direction="column" w="100%">
                    <Image
                        h={48}
                        w={192}

                        src="/assets/logo.svg"
                        alt="LoginID Inc."
                        mb="md"
                    />
                    {renderView(view)}
                    <Footer />
                </Flex>
            </Card>
        </Center>

    );
}