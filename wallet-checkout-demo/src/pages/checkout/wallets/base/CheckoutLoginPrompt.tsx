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
  Divider,
  Flex,
  Group,
  Input,
  Text,
  Title,
  UnstyledButton,
} from "@mantine/core";
import { IconAt, IconAtom } from "@tabler/icons-react";
import { Link } from "react-router-dom";

export interface BaseCheckoutLoginPromptProps {
  error: string;
  email: string;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onExternal: (bank: string) => void;
}

export function BaseCheckoutLoginPrompt({
  error,
  email,
  onSubmit,
  onExternal,
}: BaseCheckoutLoginPromptProps) {
  return (
    <form onSubmit={onSubmit} style={{ width: "100%", justifyItems: "center" }}>
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
          style={{ caretColor: "transparent" }}
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
          onClick={() => onExternal("oz")}
        >
          OZ Bank
        </Button>
        <Button
          variant="outline"
          leftSection={<IconAtom />}
          size="md"
          mb="sm"
          fullWidth
          onClick={() => onExternal("xyz")}
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
