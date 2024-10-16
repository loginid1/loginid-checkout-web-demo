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

import { FormEvent, useEffect, useState } from "react";
import { Button, Input, UnstyledButton, Text, Title, Flex, Group } from "@mantine/core";
import { LoginidService } from "@/services/loginid";
import {Link, useNavigate} from "react-router-dom";



export interface SignupPromptProps {
  onComplete: (email: string, next: string) => void;
}

export default function SignupPromptPassword(props: SignupPromptProps) {
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confPassword, setConfPassword] = useState("");

  const router = useNavigate();
  useEffect(() => {

  }, []);


  const handlerSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      // clear error
      setError("");
      // signup passwordless user
      const autoSignIn = true;
      const result = await LoginidService.client.signUpWithPassword(email,password,  confPassword, autoSignIn);
      if(result.isAuthenticated) {
        return props.onComplete(email, "passkey");
      } else{
        /// user is created but cannot auto sign in redirect to login
        router("/login");
      }
    } catch (e: any) {
      console.log(e);
      setError(e.message || e.msg || e );
    }
  };

  return (
    <form onSubmit={handlerSubmit} style={{ width: '100%', justifyItems: 'center' }}>
      <Flex align="center" direction="column" ml="xl" mr="xl">
        <Title order={4} mt="md" mb="sm">Enter Email To Sign Up</Title>
        {error && <Text c="red.5">{error}</Text>}
        <Input
          onChange={(e) => setEmail(e.target.value)}
          mb="md"
          placeholder="Email"
          type="email"
          value={email}
          w="100%"

        />

        <Input.Wrapper label="Password" w="100%">
        <Input
          onChange={(e) => setPassword(e.target.value)}
          mb="md"
          type="password"
          value={password}
          w="100%"

        />
        </Input.Wrapper>
        <Input.Wrapper label="Confirm Password" w="100%">

        <Input
          onChange={(e) => setConfPassword(e.target.value)}
          mb="md"
          type="password"
          value={confPassword}
          w="100%"

        />
        </Input.Wrapper>
        <Button type="submit" size="md" mb="sm" fullWidth>
          SignUp
        </Button>
        <UnstyledButton
        >
          <Group>
            Already have an account? <Link to="/login" style={{textDecoration:"none"}}><Text c="blue.5" >Sign in</Text></Link>
          </Group>
        </UnstyledButton>
      </Flex>
    </form>
  );
};

