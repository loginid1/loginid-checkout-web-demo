import {
  alpha,
  Box,
  Button,
  Card,
  CardContent,
  Typography,
} from "@mui/material";
import React from "react";
import ParseUtil from "../lib/util/parse";
import { Credential } from "../lib/VaultSDK/vault/user";

interface CredentialCard {
  credential: Credential;
}

export const CredentialCards: React.FC<CredentialCard> = ({ credential }) => {
  const credIAT = ParseUtil.parseDate(credential.iat);

  return (
    <Box>
      <Typography noWrap variant="h3" align="left" overflow="hidden">
        {credential.name}
      </Typography>
      <Typography noWrap variant="body1" align="left">
        Added {credIAT}
      </Typography>
    </Box>
  );
};
