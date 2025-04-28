/*
 *   Copyright (c) 2025 LoginID Inc
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

import { Card, Center, Flex, Image } from "@mantine/core";
import { Footer } from "../../components/common/Footer";
import LoginPromptPassword from "./LoginPromptPassword";
import { useSearchParams } from "react-router-dom";
import { stringToBase64Url } from "@/lib/encoding";
import { useEffect, useState } from "react";
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

/**
 * BankingPage
 *
 * This component simulates a fallback login flow via a bank authentication screen.
 *
 * Responsibilities:
 * - Parses incoming banking transaction data (amount, merchant, order id) from URL query params.
 * - Displays a simple email/password login prompt to simulate a bank login experience.
 * - On successful "login", redirects to the external authentication flow for passkey registration.
 *
 * Flow Summary:
 * 1. Parse order data from merchant site (passed as Base64Url-encoded query param).
 * 2. Display bank login UI using the `LoginPromptPassword` component.
 * 3. After form submission, redirect to `/external` with the login session details for further processing.
 */
export default function BankingPage() {
  const [view] = useState<LoginViewEnum>(LoginViewEnum.LoginPrompt);
  const [searchParams] = useSearchParams();
  const [data, setData] = useState<BankingData | null>(null);

  useEffect(() => {
    const queryData = searchParams.get("data");
    setData(ParseUtil.parseB64Data(queryData));
  }, [searchParams]);

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

  function onLoginPromptComplete(email: string) {
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
