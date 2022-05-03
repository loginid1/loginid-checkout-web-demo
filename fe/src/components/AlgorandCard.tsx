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
import { Account } from "../lib/VaultSDK/vault/algo";
  
  interface AlgorandAccountCard {
    account: Account;
  }
  
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
            <Stack direction="row" justifyContent="space-between">
              <Box>
                <Typography
                  noWrap
                  variant="h3"
                  align="left"
                  overflow="hidden"
                  textOverflow="ellipsis"
                >
                    {/* TIM NUM 3629 */}
                  {account.credentials_name}
                </Typography>
                <Typography variant="body1" align="left">
                  Added {credIAT}
                </Typography>
              </Box>
              <Box>
                <Stack direction="row" spacing={2}>
                  <Button variant="outlined" color="error">
                    Revoke
                  </Button>
                  <Button variant="outlined" color="primary">
                    Show Details
                  </Button>
                  <Button variant="outlined" color="primary">
                    Rephrase
                  </Button>
                </Stack>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Box>
    );
  };
  