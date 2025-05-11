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
  Button,
  Input,
  UnstyledButton,
  Text,
  Title,
  Flex,
  Group,
  Divider,
} from "@mantine/core";
import { IconAt, IconAtom } from "@tabler/icons-react";
import { FormEvent, useEffect, useState } from "react";
import { LIDService } from "@/services/loginid";
import { Link } from "react-router-dom";
import ParseUtil from "@/lib/parse";

export interface CheckoutLoginPromptProps {
  onComplete: (email: string, token: string, next: string) => void;
  onExternal: (bank: string) => void;
}

/**
 * CheckoutLoginPrompt
 *
 * This component handles fallback authentication in the checkout flow,
 * giving users the option to login with a passkey or via external bank login.
 *
 * Responsibilities:
 * - Attempts to auto-fill passkey login immediately on page load.
 * - Provides a manual login option with passkey usernameless authentication.
 * - Allows users to select a bank if passkey authentication is not available.
 * - After authentication, calls the parent `onComplete` to continue checkout flow.
 *
 * Flow Summary:
 * 1. Try passkey autofill silently on load using LoginID SDK.
 * 2. Offer manual passkey usernameless login as a button submit.
 * 3. Offer fallback buttons for external (bank) login selection.
 */
export default function CheckoutLoginPrompt(props: CheckoutLoginPromptProps) {
  const [error, setError] = useState("");
  const [email] = useState("");

  useEffect(() => {
    handleAutoFill();
  }, []);

  async function handleAutoFill() {
    try {
      const result = await LIDService.client.performAction("passkey:auth", {
        autoFill: true,
      });

      if (result.isComplete && result.accessToken) {
        const token = ParseUtil.parseToken(result.accessToken);
        return props.onComplete(token["username"], token, "passkey");
      } else {
        setError("invalid credential");
      }
    } catch (e: any) {
      const msg = e.message || e.msg || e;
      console.log(msg);
    }
  }

  const handlerSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      setError("");

      const result = await LIDService.client.performAction("passkey:auth");

      if (result.isComplete && result.accessToken) {
        const token = ParseUtil.parseToken(result.accessToken);
        return props.onComplete(token["username"], token, "passkey");
      } else {
        setError("invalid credential");
      }
    } catch (e: any) {
      setError(e.message || e.msg);
    }
  };

  function handleExternal(bank: string) {
    return props.onExternal(bank);
  }

  return (
    <form
      onSubmit={handlerSubmit}
      style={{ width: "100%", justifyItems: "center" }}
    >
      <Flex align="center" direction="column" ml="xl" mr="xl">
        <Title order={4} mt="md" mb="sm">
          Sign In
        </Title>
        {error && (
          <Text c="red.4" lineClamp={64}>
            {error}
          </Text>
        )}
        <Input
          mb="md"
          placeholder="Sign In with Passkey"
          type="email"
          value={email}
          autoComplete="username webauthn"
          w="100%"
          autoFocus
          //inputMode="none"
          style={{ caretColor: "transparent" }}
          //onClick={(e) => {handlerSubmit}}
          onKeyDown={(e) => {
            e.preventDefault();
            return false;
          }}
        />

        <Button type="submit" size="md" mb="sm" fullWidth>
          Log in
        </Button>
        <Divider m="md" />
        <Text fw={700} m="md">
          Select other financial institution:
        </Text>
        <Button
          variant="outline"
          leftSection={<IconAt />}
          size="md"
          mb="sm"
          fullWidth
          onClick={(e) => handleExternal("oz")}
        >
          OZ Bank
        </Button>
        <Button
          variant="outline"
          leftSection={<IconAtom />}
          size="md"
          mb="sm"
          fullWidth
          onClick={(e) => handleExternal("xyz")}
        >
          XYZ Financial
        </Button>
        <UnstyledButton>
          <Group>
            Don&apos;t have an account?{" "}
            <Link to="/signup" style={{ textDecoration: "none" }}>
              <Text c="blue.5">Sign up</Text>
            </Link>
          </Group>
        </UnstyledButton>
      </Flex>
    </form>
  );
}
