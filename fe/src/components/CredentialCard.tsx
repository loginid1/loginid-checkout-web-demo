import {
  alpha,
  Box,
  Button,
  Card,
  CardContent,
  Typography,
} from "@mui/material";
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

  const credIAT = dateTimeFormat.format(Date.parse(credential.iat));

  return (
    <Box>
      <Typography
        noWrap
        variant="h3"
        align="left"
        overflow="hidden"
      >
        {credential.name}
      </Typography>
      <Typography noWrap variant="body1" align="left">
        Added {credIAT}
      </Typography>
    </Box>
  );
};
