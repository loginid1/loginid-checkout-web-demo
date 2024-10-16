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
import { Button, Text, Group, Flex, Title, Image, Chip, rem } from "@mantine/core";
import { LoginidService } from "@/services/loginid";

import { IconMail } from '@tabler/icons-react';

export default interface AddPasskeyProps {
  email: string,
  onComplete: (success: boolean) => void;
}

export function AddPasskey(props: AddPasskeyProps) {
  const [error, setError] = useState("");

  useEffect(() => {

  }, []);


  const handlerSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const token = LoginidService.client.getSessionInfo().idToken;
      if(token){
        const session = await LoginidService.client.createPasskey(props.email, token);
        localStorage.setItem("preid-email",props.email);
        props.onComplete(true);
      } else {
        setError("error create passkey - not authorized")
      }
    } catch (e: any) {
      setError(e.message || e.msg || e);
    }
  };

  function handleCancel() {
    props.onComplete(false);
  }

  return (
    <form onSubmit={handlerSubmit}>

      <Flex align="center" direction="column" m="md" mb={16}>

        <Title order={4} >Simplify Your Sign-in With Passkey</Title>
        <Chip icon={<IconMail style={{ width: rem(16), height: rem(16) }} />}
          color="blue.7"
          variant="filled" m="md" defaultChecked>{props.email}</Chip>
        {error && <Text c="red.5">{error}</Text>}

        <Flex direction="row" justify="center" gap="md" p="md" >
          <Group gap="md">

            <Image h={48} w={48} src="/assets/touchid.svg" fit="contain" alt="touchid"/>
            <Image h={48} w={48} fit="contain" src="/assets/faceid.svg" alt="faceid" />
          </Group>
        </Flex>

        <Text pb="lg">With passkeys you can now use your fingerpint, face, or screen lock to verify it&apos;s really you</Text>
        <Group justify="space-between" w="100%">

          <Button variant="light" size="md" onClick={() => handleCancel()}>
            Skip
          </Button>
          <Button type="submit" size="md" >
            Add A Passkey
          </Button>

        </Group>
      </Flex>
    </form>
  );
};

