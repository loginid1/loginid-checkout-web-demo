'use client';

import { Card, Group, Text } from "@mantine/core";
import {IconSquareKey} from "@tabler/icons-react";

interface PasskeyProps {
  id: string;
  name: string;
}

export function Passkey(props: PasskeyProps) {

  return (
    <Card id={props.id} m="xs">
      <Group><IconSquareKey></IconSquareKey><Text>{props.name}</Text></Group>
    </Card>
  );
};

export default Passkey;

