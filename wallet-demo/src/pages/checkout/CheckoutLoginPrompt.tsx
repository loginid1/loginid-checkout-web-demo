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
import { FormEvent, useEffect, useRef, useState } from "react";
import { IconAt, IconAtom } from "@tabler/icons-react";
import { Link, useNavigate } from "react-router-dom";
import { LIDService } from "@/services/loginid";
import ParseUtil from "@/lib/parse";

export interface CheckoutLoginPromptProps {
  onComplete: (email: string, token: string, next: string) => void;
}

export default function CheckoutLoginPrompt(props: CheckoutLoginPromptProps) {
  const [error, setError] = useState("");
  const [abortController] = useState(new AbortController());
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const router = useNavigate();
  useEffect(() => {
    document.onkeypress = function (e) {
      e.preventDefault();
      return false;
    };
    handleAutoFill();
    // this is important to unlock webauthn credential used by auto-fill when existing the page
    return () => {
      abortController.abort();
    };
  }, []);

  async function handleAutoFill() {
    try {
      const result = await LIDService.client.performAction("passkey:auth", {
        autoFill: true,
      });

      //return router("/manage");
      if (result.isComplete && result.accessToken) {
        const token = ParseUtil.parseToken(result.accessToken);
        //console.log(token);
        return props.onComplete(token["username"], token, "passkey");
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
        return props.onComplete(
          token["username"],
          result.accessToken,
          "passkey",
        );
      } else {
        setError("invalid credential");
      }
    } catch (e: any) {
      setError(e.message || e.msg);
    }
  };

  function handleExternal() {
    return props.onComplete(email, "", "external");
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
          Select a financial institution:
        </Text>
        <Button
          variant="outline"
          leftSection={<IconAt />}
          size="md"
          mb="sm"
          fullWidth
          onClick={handleExternal}
        >
          ABC Bank
        </Button>
        <Button
          variant="outline"
          leftSection={<IconAtom />}
          size="md"
          mb="sm"
          fullWidth
          onClick={handleExternal}
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
