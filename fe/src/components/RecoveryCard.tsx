import {
  alpha,
  Box,
  Button,
  Card,
  CardContent,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import React from "react";
import { Recovery } from "../lib/VaultSDK/vault/user";
import { LoginID } from "../theme/theme";
import { ContentCopy } from "@mui/icons-material";

interface RecoveryCard {
  recovery: Recovery;
  showCopy?: boolean;
}

export const RecoveryCard: React.FC<RecoveryCard> = ({
  recovery,
  showCopy,
}) => {
  const dateTimeFormat = new Intl.DateTimeFormat("en", {
    month: "numeric",
    year: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
  });

  const credIAT = dateTimeFormat.format(Date.parse(recovery.iat));
  const copyPublicKey = () => {
    navigator.clipboard.writeText(recovery.public_key);
  };

  return (
    <Box>
      <Stack direction="row" spacing={2} alignItems="center">
        <Typography
          noWrap
          maxWidth="30%"
          variant="h3"
          align="left"
          overflow="hidden"
        >
          {recovery.public_key}
        </Typography>
        {showCopy && (
          <IconButton size="small" onClick={copyPublicKey}>
            <ContentCopy />
          </IconButton>
        )}
      </Stack>
      <Typography noWrap variant="body1" align="left">
        Added {credIAT}
      </Typography>
    </Box>
  );
};
