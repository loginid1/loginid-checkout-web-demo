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
  Card,
  Center,
  Container,
  Group,
  Image,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import "./styles.css";

export interface KCheckoutLoginPromptProps {
  error: string;
  email: string;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onExternal: (bank: string) => void;
  redirect: boolean;
}

export function KCheckoutLoginPrompt({
  error,
  email,
  onSubmit,
  onExternal,
  redirect,
}: KCheckoutLoginPromptProps) {
  return (
    <Center h="100vh" w="100%" bg="#f8f8f8">
      <Card
        w={{ base: "100%", xs: 540, md: 720 }}
        bg="#f8f8f8"
        mih={420}
        p="sm"
      >
        {redirect && (
          <Center>
            <Image w={120} src="/assets/wallet-logo.svg" alt="Wallet Logo" />
          </Center>
        )}
        <form onSubmit={onSubmit} className="login-form">
          <Container className="container" w="100%">
            <Title ta="left" order={3}>
              Select a financial institution
            </Title>
            <Text ta="left" c="dimmed" mb="lg">
              Securely fetch your payment details and complete checkout.
            </Text>
            {error && (
              <Text c="red.4" lineClamp={64}>
                {error}
              </Text>
            )}

            <Card className="checkout-box" withBorder>
              <Group justify="space-between">
                <TextInput
                  type="email"
                  placeholder="Already have an account?"
                  autoComplete="username webauthn"
                  radius="md"
                  variant="filled"
                  w="190px"
                  value={email}
                  onKeyDown={(e) => {
                    e.preventDefault();
                    return false;
                  }}
                />
                <Button
                  color="#ca27ca"
                  type="submit"
                  variant="filled"
                  radius="md"
                >
                  Log in
                </Button>
              </Group>
            </Card>

            <Stack gap="xs">
              <Card
                withBorder
                radius="md"
                p="sm"
                className="bank-card"
                onClick={() => onExternal("oz")}
                style={{ cursor: "pointer" }}
              >
                <Group>
                  <Image
                    className="oz-bank-image"
                    src="/assets/oz-bank.svg"
                    alt="OZ Bank"
                    radius="xl"
                    w={47}
                    h={47}
                  />
                  <Text>OZ Bank</Text>
                </Group>
              </Card>
              <Card
                withBorder
                radius="md"
                p="sm"
                className="bank-card"
                onClick={() => onExternal("xyz")}
                style={{ cursor: "pointer" }}
              >
                <Group>
                  <Image
                    className="oz-bank-image"
                    src="/assets/xyz-bank.svg"
                    alt="XYZ Financial"
                    radius="xl"
                    w={47}
                    h={47}
                  />
                  <Text>XYZ Financial</Text>
                </Group>
              </Card>
            </Stack>
          </Container>
        </form>
      </Card>
    </Center>
  );
}
