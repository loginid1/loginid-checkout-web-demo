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

import {
  Card,
  Center,
  createTheme,
  Flex,
  Group,
  MantineProvider,
  MantineThemeOverride,
  Title,
  virtualColor,
} from "@mantine/core";
import { Footer } from "../../components/common/Footer";
import LoginPromptPassword from "./LoginPromptPassword";
import { IconAt, IconAtom } from "@tabler/icons-react";
import { ReactNode, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { stringToBase64Url } from "@/lib/encoding";
import ParseUtil from "@/lib/parse";

export interface BankProps {
  name: string;
  theme: MantineThemeOverride;
  icon: ReactNode;
}

const ozTheme = createTheme({
  fontFamily: "Open Sans, sans-serif",
  primaryColor: "cyan",
  defaultRadius: 0,
  colors: {
    title: virtualColor({
      name: "title",
      dark: "cyan",
      light: "cyan",
    }),
  },
  headings: {
    fontWeight: "700",
  },
});

const xyzTheme = createTheme({
  fontFamily: "Open Sans, sans-serif",
  primaryColor: "orange",
  defaultRadius: 4,
  colors: {
    title: virtualColor({
      name: "title",
      dark: "orange",
      light: "orange",
    }),
  },
  headings: {
    fontWeight: "700",
  },
});
const DEFAULT_PROPS = { name: "OZ Bank", theme: ozTheme, icon: <IconAt /> };
export const BANK_MAP: Map<string, BankProps> = new Map([
  ["oz", DEFAULT_PROPS],
  ["xyz", { name: "XYZ Financial", theme: xyzTheme, icon: <IconAtom /> }],
]);

export enum LoginViewEnum {
  EmailConfirmation = "email-confirmation",
  LoginPrompt = "login-prompt",
  AddPasskey = "add-passkey",
}

export interface BankingData {
  id: string;
  bank: string;
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
  const [bank, setBank] = useState<BankProps>(DEFAULT_PROPS);

  useEffect(() => {
    const queryData = searchParams.get("data");
    const bankData: BankingData | null = ParseUtil.parseB64Data(queryData);
    if (bankData) {
      setData(bankData);
      const props = BANK_MAP.get(bankData.bank);
      if (props) {
        setBank(props);
      }
    }
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
    <MantineProvider theme={bank.theme}>
      <Center h="100vh" w="100%">
        <Card shadow="sm" w={{ base: 356, md: 480, lg: 550 }} mih={420} p="sm">
          <Flex justify="center" align="center" direction="column" w="100%">
            <Group justify="center" m="md">
              <Title c="title">{bank.name}</Title>
            </Group>
            {renderView(view)}
            <Footer />
          </Flex>
        </Card>
      </Center>
    </MantineProvider>
  );
}
