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
import { FormEvent, useEffect, useRef, useState } from "react";
import { Button, Input, UnstyledButton, Text, Title, Flex, Group } from "@mantine/core";
import { LoginidService } from "@/services/loginid";
import {Link, useNavigate} from "react-router-dom";


export interface LoginPromptProps {
  onComplete: (email: string, next: string) => void;
}

export default function LoginPromptPassword(props: LoginPromptProps) {
  const [error, setError] = useState("");
  const [abortController] = useState(new AbortController());
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(true);

  const router = useNavigate();
  useEffect(() => {

    setShowPassword(!LoginidService.client.hasTrustedDevice())
    handleAutoFill();
    // this is important to unlock webauthn credential used by auto-fill when existing the page
    return () => {
      abortController.abort();
    };

  }, []);


  async function handleAutoFill() {
    try {
      await LoginidService.client.authenticateWithPasskeyAutofill({ abortController: abortController });
      return router("/manage");

    } catch (e: any) {
      const msg = e.message || e.msg || e;
      console.log(msg);
    }
  }


  const handlerSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      setError("");

      if (password !== "") {
        await LoginidService.client.authenticateWithPassword(email, password);
        // complete signin and go to create passkey suggestion
        return props.onComplete(email, "passkey");

      } else {
        const result = await LoginidService.client.authenticateWithPasskey(email, { abortController});
        if(result.isAuthenticated) {
          return props.onComplete(email, "");
        } else {
          // fallback to password
          setShowPassword(true);
        }
      }
    } catch (e: any) {
      setError(e.message || e.msg);
    }
  };

  return (
    <form onSubmit={handlerSubmit} style={{ width: '100%', justifyItems: 'center' }}>
      <Flex align="center" direction="column" ml="xl" mr="xl">

        <Title order={4} mt="md" mb="sm">Sign In</Title>
        {error && <Text c="red.4" lineClamp={64} >{error}</Text>}
        <Input
          onChange={(e) => setEmail(e.target.value)}
          mb="md"
          placeholder="Email"
          type="email"
          value={email}
          autoComplete="username webauthn "
          w="100%"
        />

        {showPassword &&
          <Input.Wrapper label="Password" w="100%">
            <Input
              onChange={(e) => setPassword(e.target.value)}
              mb="md"
              type="password"
              value={password}
              autoComplete="password webauthn"
              w="100%"
            />
          </Input.Wrapper>
        }
        <Button type="submit" size="md" mb="sm" fullWidth>
          Login
        </Button>
        <UnstyledButton
        >
          <Group>
            Don&apos;t have an account? <Link to="/signup" style={{ textDecoration: "none" }}><Text c="blue.5" >Sign up</Text></Link>
          </Group>
        </UnstyledButton>
      </Flex>
    </form>
  );
};

