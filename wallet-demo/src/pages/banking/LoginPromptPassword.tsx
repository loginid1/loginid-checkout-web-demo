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
import { Link, useNavigate } from "react-router-dom";


export interface LoginPromptProps {
  amount: string;
  merchant: string;
  onComplete: (email: string, next: string) => void;
}

export default function LoginPromptPassword(props: LoginPromptProps) {
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(true);

  const router = useNavigate();
  useEffect(() => {

  }, []);

  const handlerSubmit = async (event: FormEvent<HTMLFormElement>) => {
      console.log("submit"); 
    event.preventDefault();
    try {
      setError("");
      console.log("begin login"); 

      if (password === "testing") {
        // redirect back to external
        // else set error
        console.log("success login"); 
        return props.onComplete(email, "redirect");
      } else {
        setError("invalid username or password")
      }

    } catch (e: any) {
      setError(e.message || e.msg);
    }
  };

  return (
    <form onSubmit={handlerSubmit} style={{ width: '100%', justifyItems: 'center' }}>
      <Flex align="center" direction="column" ml="xl" mr="xl">

        <Title order={4} mt="md" mb="sm">Sign In to Pay ${props.amount} to {props.merchant}</Title>
        {error && <Text c="red.4" lineClamp={64} >{error}</Text>}
        <Input
          onChange={(e) => setEmail(e.target.value)}
          mb="md"
          placeholder="Username"
          value={email}
          w="100%"
        />

        {showPassword &&
          <Input.Wrapper label="Password" w="100%">
            <Input
              onChange={(e) => setPassword(e.target.value)}
              mb="md"
              type="password"
              value={password}
              w="100%"
            />
          </Input.Wrapper>
        }
        <Button type="submit" size="md" mb="sm" fullWidth>
          SIGN IN
        </Button>
      </Flex>
    </form>
  );
};

