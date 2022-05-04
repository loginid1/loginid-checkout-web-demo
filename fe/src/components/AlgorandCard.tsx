import {
  alpha,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import React from "react";
import { Recovery } from "../lib/VaultSDK/vault/user";
import { LoginID } from "../theme/theme";
import { ContentCopy } from "@mui/icons-material";
import { Account } from "../lib/VaultSDK/vault/algo";
import ParseUtil from "../lib/util/parse";

interface AlgorandAccountCard {
  account: Account;
}

const cutoff = (s: string) => {
  return s.substring(0, 10) + "...";
};

export const AlgorandCard: React.FC<AlgorandAccountCard> = ({ account }) => {
  const accountIAT = ParseUtil.parseDate(account.iat);
  const cutAddress = ParseUtil.displayLongAddress(account.address);
  const copyAddress = () => {
    navigator.clipboard.writeText(account.address);
  };
  return (
    <Box>
      <Card
        variant="outlined"
        sx={{ width: "100%", backgroundColor: alpha("#F2F2F2", 0.2) }}
        elevation={0}
      >
        <CardContent
          sx={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Box maxWidth="50vw">
              <Typography
                noWrap
                maxWidth="30vw"
                variant="h3"
                align="left"
                overflow="hidden"
                textOverflow="ellipsis"
              >
                {account.alias}
              </Typography>
              <Stack direction="row" spacing={2} alignItems="center">
                <Typography
                  noWrap
                  variant="body1"
                  align="left"
                  overflow="hidden"
                  textOverflow="ellipsis"
                >
                  {cutAddress}
                </Typography>
                <IconButton size="small" onClick={copyAddress}>
                  <ContentCopy />
                </IconButton>
              </Stack>
              <Typography variant="body1" align="left">
                Added {accountIAT}
              </Typography>
              <Typography variant="body1" align="left">
                Recovery option:{" "}
                <Chip label={cutoff(account.recovery_address)} /> | Credentials:{" "}
                {account.credentials_name.map((name) => (
                  <Chip label={name} />
                ))}
              </Typography>
            </Box>
            <Box>
              {/* <Stack direction="row" spacing={2}>
                <Button variant="outlined" color="primary">
                  Show Details
                </Button>
                <Button variant="outlined" color="primary">
                  Rekey
                </Button>
              </Stack> */}
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
};
