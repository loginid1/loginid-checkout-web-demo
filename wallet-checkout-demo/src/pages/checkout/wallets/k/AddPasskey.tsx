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
  Title,
  Image,
  Container,
  Stack,
  Card,
  Center,
} from "@mantine/core";
import { LIDService } from "@/services/loginid";
import { FormEvent, useState } from "react";
import "./styles.css";

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
    <Center h="100vh" w="100%" bg="#f8f8f8">
      <Card w={{ base: "100%", xs: 540, sm: 720 }} bg="#f8f8f8" mih={420} p="sm">
        <form onSubmit={handlerSubmit}>
          <Container className="container" w="100%" ta="left">
            <Image
              src="/assets/hero-passkey-icon.svg"
              alt="Passkey icon"
              h={80}
              w={80}
              mx="auto"
              mb="md"
            />
            <Title order={3}>
              Faster checkouts with passkey
            </Title>
            <Text c="dimmed" mb="lg">
              Unlock your account’s full potential by creating a passkey or you can create your passkey later.
            </Text>

            <Stack gap="md" mb="xl">
              <Group justify="flex-start" align="flex-start" wrap="nowrap">
                <Image
                  style={{alignSelf: "center"}}
                  src="/assets/passkey-icon-black.svg"
                  alt="Passkey icon"
                  h={28}
                  w={28}
                />
                <div>
                  <Text size="sm" fw={500}>Create a passkey</Text>
                  <Text size="xs" c="dimmed">
                    Convenient options like trusting your device. Face ID, Touch ID, or a PIN for quick and secure access.
                  </Text>
                </div>
              </Group>
              <Group justify="flex-start" align="flex-start" wrap="nowrap">
                <Image
                  style={{alignSelf: "center"}}
                  src="/assets/faceid.svg"
                  alt="Face ID icon"
                  h={28}
                  w={28}
                />
                <div>
                  <Text size="sm" fw={500}>Make one-click payments</Text>
                  <Text size="xs" c="dimmed">
                    Enjoy faster checkouts by authenticating with your passkey.
                  </Text>
                </div>
              </Group>
            </Stack>

            <Stack>
              <Button fullWidth type="submit" size="md" color="#ca27ca">
                Create a passkey
              </Button>
              <Button
                fullWidth
                color="#ca27ca"
                variant="outline"
                size="md"
                onClick={handleCancel}
              >
                Show me later
              </Button>
            </Stack>
          </Container>
        </form>
      </Card>
    </Center>
  );
}
