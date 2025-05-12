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

import {
  Button,
  Text,
  Group,
  Flex,
  Title,
  Image,
  Chip,
  Card,
  Center,
  rem,
} from "@mantine/core";
import { LIDService } from "@/services/loginid";
import { IconMail } from "@tabler/icons-react";
import { FormEvent, useState } from "react";

export default interface AddPasskeyProps {
  username: string;
  onComplete: (success: boolean) => void;
}

/**
 * AddPasskey
 *
 * This component handles prompting the user to create a passkey after external authentication.
 *
 * Responsibilities:
 * - Displays a simple UI encouraging the user to create a passkey linked to their identity.
 * - Initiates passkey registration using LoginID Wallet SDK (`performAction("passkey:reg")`).
 * - Handles both successful registration and cancellation (skip) events.
 *
 * Flow Summary:
 * 1. User is shown a prompt to add a passkey, associated with their username.
 * 2. On submit, a passkey registration ceremony is triggered.
 * 3. On success or skip, the parent onComplete callback is fired to continue the checkout flow.
 */
export function AddPasskey(props: AddPasskeyProps) {
  const [error, setError] = useState("");

  const handlerSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      await LIDService.client.performAction("passkey:reg");
      props.onComplete(true);
    } catch (e: any) {
      setError(e.message || e.msg || e);
    }
  };

  function handleCancel() {
    props.onComplete(false);
  }

  return (
    <Center h="100vh" w="100%">
      <Card shadow="sm" w={{ base: "100%", md: 480, lg: 550 }} mih={420} p="sm">
        <Flex justify="center" align="center" direction="column" w="100%">
          <Image
            h={24}
            w={96}
            src="/assets/logo.svg"
            alt="LoginID Inc."
            mb="md"
          />
          <form onSubmit={handlerSubmit}>
            <Flex align="center" direction="column" m="md" mb={16}>
              <Title order={4}>Simplify Your Sign-in With Passkey</Title>
              <Chip
                icon={<IconMail style={{ width: rem(16), height: rem(16) }} />}
                color="blue.7"
                variant="filled"
                m="md"
                defaultChecked
              >
                {props.username}
              </Chip>
              {error && <Text c="red.5">{error}</Text>}

              <Flex direction="row" justify="center" gap="md" p="md">
                <Group gap="md">
                  <Image
                    h={48}
                    w={48}
                    src="/assets/touchid.svg"
                    fit="contain"
                    alt="touchid"
                  />
                  <Image
                    h={48}
                    w={48}
                    fit="contain"
                    src="/assets/faceid.svg"
                    alt="faceid"
                  />
                </Group>
              </Flex>

              <Text pb="lg">
                With passkeys you can now use your fingerpint, face, or screen
                lock to verify it&apos;s really you
              </Text>
              <Group justify="space-between" w="100%">
                <Button
                  variant="light"
                  size="md"
                  onClick={() => handleCancel()}
                >
                  Skip
                </Button>
                <Button type="submit" size="md">
                  Add A Passkey
                </Button>
              </Group>
            </Flex>
          </form>
        </Flex>
      </Card>
    </Center>
  );
}
