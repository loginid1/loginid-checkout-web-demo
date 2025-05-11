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
  IconCreditCard,
  IconFaceId,
  IconFingerprint,
} from "@tabler/icons-react";
import { Button, Grid, Text, Divider, Image, Container } from "@mantine/core";
import { TxPayload } from "../../CheckoutConfirmPrompt";
import ParseUtil from "@/lib/parse";

export interface BaseCheckoutConfirmPromptProps {
  payData: TxPayload;
  error: string;
  txRef: string;
  onConfirm: () => void;
  token: string;
}

export function BaseCheckoutConfirmPrompt(
  props: BaseCheckoutConfirmPromptProps,
) {
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
    <Container w="100%">
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
      <Grid>
        <Grid.Col
          span={4}
          style={{ display: "flex", justifyContent: "flex-end" }}
        >
          <Image h={36} w={64} src="/assets/my-bank.png" />
        </Grid.Col>
        <Grid.Col span={8}>
          <Text size="sm" ta="left">
            My Bank Rewards
            <br />
            ******5465
          </Text>
        </Grid.Col>
      </Grid>
      <Divider mb="xs" mt="xs"></Divider>
      <Grid>
        <Grid.Col span={4}>
          <Text fw={700} ta="right" size="sm">
            SHIPPING
          </Text>
        </Grid.Col>
        <Grid.Col span={8}>
          <Text size="sm" ta="left">
            {props.payData.Address.Street}
            <br />
            {props.payData.Address.City} , {props.payData.Address.State}
            <br />
            {props.payData.Address.Country} {props.payData.Address.Postal}
          </Text>
        </Grid.Col>
      </Grid>
      <Divider mb="xs" mt="xs"></Divider>
      <Grid>
        <Grid.Col span={4}>
          <Text fw={700} ta="right" size="sm">
            CONTACT
          </Text>
        </Grid.Col>
        <Grid.Col span={8}>
          <Text size="sm" ta="left">
            {props.payData.Contact}
            <br />
            {props.payData.Email} <br />
          </Text>
        </Grid.Col>
      </Grid>
      <Divider mb="xs" mt="xs"></Divider>
      <Grid mt={0}>
        <Grid.Col span={8}>
          <Text fw={500} ta="right" size="xs">
            SUBTOTAL
          </Text>
        </Grid.Col>
        <Grid.Col span={4}>
          <Text size="xs" ta="left">
            {props.payData.Subtotal}{" "}
          </Text>
        </Grid.Col>
      </Grid>
      <Grid mt={0}>
        <Grid.Col span={8}>
          <Text fw={500} ta="right" size="xs">
            SHIPPING
          </Text>
        </Grid.Col>
        <Grid.Col span={4}>
          <Text size="xs" ta="left">
            {props.payData.Shipping}{" "}
          </Text>
        </Grid.Col>
      </Grid>
      <Grid mt={0}>
        <Grid.Col span={8}>
          <Text fw={500} ta="right" size="xs">
            TAX
          </Text>
        </Grid.Col>
        <Grid.Col span={4}>
          <Text size="xs" ta="left">
            {props.payData.Tax}{" "}
          </Text>
        </Grid.Col>
      </Grid>
      <Grid>
        <Grid.Col span={8}>
          <Text fw={700} ta="right">
            PAY {props.payData.Merchant}{" "}
          </Text>
        </Grid.Col>
        <Grid.Col span={4} ta="left">
          ${props.payData.Total}
        </Grid.Col>
      </Grid>
      <Divider mb="xs" mt="xs"></Divider>
      <Button leftSection={ButtonIcon()} onClick={props.onConfirm}>
        Confirm
      </Button>
    </Container>
  );
}
