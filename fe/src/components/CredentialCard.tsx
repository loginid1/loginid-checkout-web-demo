import { alpha, Box, Button, Card, CardContent, Typography } from "@mui/material";
import React from "react";
import { Credential } from "../lib/VaultSDK/vault/user";

interface CredentialCard {
  credential: Credential;
}

export const CredentialCards: React.FC<CredentialCard> = ({ credential }) => {
  const dateTimeFormat = new Intl.DateTimeFormat("en", {
      month: "numeric",
    year: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",

  });
  
  const credIAT = dateTimeFormat.format(Date.parse(credential.iat))

  // const [name, addDate] = credential
  return (
    <Box>
      <Card
        variant="outlined"
        sx={{ width: "100", backgroundColor: alpha("#F2F2F2", 0.2) }}
        elevation={0}>
        <CardContent sx={{
            alignContent: "start"
        }}>
          <Typography variant="h3" align="left">{credential.name}</Typography>
          <Typography variant="body1" align="left">
            Added {credIAT}
          </Typography>
          <Button variant="outlined" color="error">
            Revoke
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
};
