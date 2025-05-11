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
  Grid,
  Card,
  Group,
  Text,
  Divider,
  Image,
  Container,
} from "@mantine/core";
import {
  IconCreditCard,
  IconFaceId,
  IconFingerprint,
} from "@tabler/icons-react";
import { TxPayload } from "../../CheckoutConfirmPrompt";
import ParseUtil from "@/lib/parse";
import "./styles.css";

export interface KCheckoutConfirmPromptProps {
  payData: TxPayload;
  error: string;
  txRef: string;
  onConfirm: () => void;
  token: string;
}

export function KCheckoutConfirmPrompt(props: KCheckoutConfirmPromptProps) {
  const requestAddress = `${props.payData.Address.City}, ${props.payData.Address.State}, ${props.payData.Address.Postal}`;

  function ButtonIcon() {
    const SIZE = 24;
    if (props.token !== "") {
      return <IconCreditCard size={SIZE}></IconCreditCard>;
    } else {
      if (ParseUtil.isIPhone()) {
        return <IconFaceId size={SIZE}></IconFaceId>;
      } else {
        return <IconFingerprint size={SIZE}></IconFingerprint>;
      }
    }
  }

  return (
    <Container className="container" w="100%">
      {props.txRef && (
        <>
          <Grid>
            <Grid.Col span={12} ta="center">
              <Text c="green.5">Transaction Successfull</Text>
            </Grid.Col>
          </Grid>
        </>
      )}
      {props.error && <Text c="red.5">{props.error}</Text>}
      <Card className="checkout-box" withBorder>
        <Text ta="left" mb="xs" size="xs">
          {props.payData.Merchant.toUpperCase()}
        </Text>
        <Group display="flex" justify="space-between">
          <Text ta="left" size="sm">
            Order Subtotal
          </Text>
          <Text fw="bold" size="sm" c="black">
            ${props.payData.Subtotal}
          </Text>
        </Group>
        <Group display="flex" justify="space-between">
          <Text ta="left" size="sm">
            Shipping and Handling
          </Text>
          <Text fw="bold" size="sm" c="black">
            FREE
          </Text>
        </Group>
        <Group display="flex" justify="space-between">
          <Text size="sm" ta="left">
            GST/HST
          </Text>
          <Text size="sm" fw="bold" c="black">
            ${props.payData.Tax}
          </Text>
        </Group>
        <Divider my="sm" />
        <Group display="flex" justify="space-between">
          <Text size="sm" ta="left" c="black">
            Total
          </Text>
          <Text size="sm" fw="bold" c="black">
            ${props.payData.Total}
          </Text>
        </Group>
      </Card>

      <Card className="checkout-box-info" withBorder>
        <Group display="block">
          <Text ta="left" mb="xs" size="xs">
            SHIPPING ADDRESS
          </Text>
          <Text size="sm" ta="left" c="black">
            {props.payData.Address.Street}
          </Text>
          <Text size="sm" ta="left" c="black">
            {requestAddress}
          </Text>
        </Group>
        <Group>
          <Button variant="outline" radius="xl">
            Change
          </Button>
        </Group>
      </Card>

      <Card className="checkout-box-info" withBorder>
        <Group display="block">
          <Text ta="left" mb="xs" size="xs">
            PAYMENT INFO
          </Text>
          <Group>
            <Image h={24} w={38} src="/assets/pay-icon.png" />
            <Text size="xs" c="black">
              ending with 4242
            </Text>
          </Group>
        </Group>
        <Group>
          <Button variant="outline" radius="xl">
            Change
          </Button>
        </Group>
      </Card>

      <Group className="button-wrapper">
        <Button fullWidth variant="filled" rightSection={ButtonIcon()} onClick={props.onConfirm}>
          Confirm
        </Button>
      </Group>
    </Container>
  );
}
