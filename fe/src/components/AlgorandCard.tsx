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

interface AlgorandAccountCard {
  account: Account;
}

const cutoff = (s: string) => {
  return s.substring(0, 10) + "...";
};

export const AlgorandCard: React.FC<AlgorandAccountCard> = ({ account }) => {
  const dateTimeFormat = new Intl.DateTimeFormat("en", {
    month: "numeric",
    year: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
  });

  const credIAT = dateTimeFormat.format(Date.parse(account.iat));

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
            <Box>
              <Typography
                noWrap
                maxWidth="50vw"
                variant="h3"
                align="left"
                overflow="hidden"
                textOverflow="ellipsis"
              >
                {account.alias}
              </Typography>
              <Typography variant="body1" align="left">
                Added {credIAT}
              </Typography>
              <Typography variant="body1" align="left">
                Recovery option: <Chip label={cutoff(account.recovery_address)}/> {" "}
                | Credentials: {account.credentials_name.map((name) => <Chip label={name}/>)}
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
