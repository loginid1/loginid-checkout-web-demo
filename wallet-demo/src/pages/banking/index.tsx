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

"use client";

import { base64UrlToString, stringToBase64Url } from "@/lib/encoding";
import { AddPasskey } from "../../components/common/AddPasskey";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, Center, Flex, Image } from "@mantine/core";
import { Footer } from "../../components/common/Footer";
import LoginPromptPassword from "./LoginPromptPassword";
import { useEffect, useState } from "react";
import { TrustID } from "@/lib/crypto";
import ParseUtil from "@/lib/parse";

export enum LoginViewEnum {
  EmailConfirmation = "email-confirmation",
  LoginPrompt = "login-prompt",
  AddPasskey = "add-passkey",
}

export interface BankingData {
  id: string;
  amount: string;
  merchant: string;
}

export interface BankPrefs {
  id: string;
  pref: string;
  name: string;
  primary: string;
}

//let data: BankingData | null = null;
export default function BankingPage() {
  const [view, setView] = useState<LoginViewEnum>(LoginViewEnum.LoginPrompt);
  const router = useNavigate();
  const [email, setEmail] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = useState<BankingData | null>(null);

  useEffect(() => {
    console.log("banking login");
    //TrustID.test();
    const qdata = searchParams.get("data");
    setData(ParseUtil.parseB64Data(qdata));
  }, []);

  function renderView(view: LoginViewEnum) {
    if (view === LoginViewEnum.LoginPrompt) {
      return (
        <LoginPromptPassword
          amount={data?.amount || "0.00"}
          merchant={data?.merchant || "Unknown"}
          onComplete={onLoginPromptComplete}
        />
      );
    }
  }

  function onLoginPromptComplete(email: string, next: string) {
    console.log("data: ", data);
    if (data) {
      const callback =
        "/external?session=" +
        stringToBase64Url(JSON.stringify({ username: email, id: data.id }));
      document.location.href = callback;
    }
  }

  return (
    <Center h="100vh" w="100%">
      <Card shadow="sm" w={{ base: 356, md: 480, lg: 550 }} mih={420} p="sm">
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
