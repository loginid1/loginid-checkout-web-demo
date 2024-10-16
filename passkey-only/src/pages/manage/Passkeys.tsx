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

'use client';
import { useEffect } from "react";
import { useState } from "react";
import { Accordion, Text, Container } from "@mantine/core";
import Passkey from "./Passkey";
import { PasskeyCollection } from "@loginid/cognito-web-sdk";
import { LoginidService } from "@/services/loginid";

function Passkeys() {

  const [passkeyID, setPasskeyID] = useState<string | null>(null);
  const [tempPasskeyID, setTempPasskeyID] = useState<string | null>(null);
  const [error, setError] = useState("");

  const [passkeys, setPasskeys] = useState<PasskeyCollection>([]);

  useEffect(() => {
    listPasskey();
  }, []);

  async function listPasskey() {
    try {
      const collection = await LoginidService.client.listPasskeys();
      setPasskeys(collection);
    } catch (e) {
      console.log(e);
    }
  }


  return (
    <Container w="100%" >

      {error && <Text c="red.4">{error}</Text>}

      <Accordion
        value={passkeyID}
        mb="sm"
        chevronPosition="right"
        variant="contained"
      >
        {passkeys.map((passkey, index) => (
          <Passkey
            key={passkey.name + index}
            id={passkey.id}
            name={passkey.name}
          />
        ))}
      </Accordion>


    </Container>
  );
};

export default Passkeys;
