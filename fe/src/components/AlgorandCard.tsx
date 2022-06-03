import {
  alpha,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  IconButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import React, { useState } from "react";
import { Recovery } from "../lib/VaultSDK/vault/user";
import { LoginID } from "../theme/theme";
import { ContentCopy, NavigateNextTwoTone } from "@mui/icons-material";
import { Account } from "../lib/VaultSDK/vault/algo";
import ParseUtil from "../lib/util/parse";
import { useNavigate } from "react-router-dom";

interface AlgorandAccountCard {
  account: Account;
  rename: (id: string, alias: string) => Promise<void>;
}

const cutoff = (s: string) => {
  return s.substring(0, 10) + "...";
};

export const AlgorandCard: React.FC<AlgorandAccountCard> = ({
  account,
  rename,
}) => {
  const navigate = useNavigate();
  const [openRename, setOpenRename] = useState(false);
  const [newAlias, setNewAlias] = useState("");
  const accountIAT = ParseUtil.parseDate(account.iat);
  const cutAddress = ParseUtil.displayLongAddress(account.address);
  const copyAddress = () => {
    navigator.clipboard.writeText(account.address);
  };

  const handleClickRenameAccount = () => {
    setOpenRename(true);
  };

  const handleCancelRename = () => {
    setNewAlias("");
    setOpenRename(false);
  };

  const handleSubmitRename = async () => {
    await rename(account.id, newAlias);
    setOpenRename(false);
  };

  function handleClickTransaction(address: string) {
    navigate("/algorand_transactions?address=" + address);
  }

  function handleClickRekey(address: string) {
    navigate("/rekey_algorand/"+address);
  }
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
            spacing={2}
            // alignItems="center"
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
              {account.balance &&
              <>
              <Typography variant="body1" align="left">
                Balance: {account.balance?.amount} micro Algos
              </Typography>
              <Typography variant="body1" align="left">
                Current: {account.balance?.current_round} 
              </Typography>
              <Typography variant="body1" align="left">
                Status: {account.balance?.status} 
              </Typography>
              </>
              }
            </Box>
            <Box>
              <Stack direction={{ xs: "column", md: "column" }} spacing={2}>
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={handleClickRenameAccount}
                >
                  Change Alias
                </Button>
                <Button variant="outlined" color="primary" onClick={()=>handleClickTransaction(account.address)} >Transactions</Button>
                <Button variant="outlined" color="primary" onClick={()=>handleClickRekey(account.address)} >Rekey</Button>
                {/* <Button variant="outlined" color="primary">
                  Rekey
                </Button> */}
              </Stack>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      <Dialog
        open={openRename}
        sx={{
          display: "flex",
          justifyContent: "center",
        }}
        onClose={handleCancelRename}
      >
        <Stack
          spacing={2}
          sx={{
            alignItems: "center",
            p: 6,
            width: "400px",
          }}
        >
          <Typography variant="h2" color="secondary">
            Change Alias
          </Typography>
          <Typography variant="body1"></Typography>
          <TextField
            fullWidth
            onChange={(e) => setNewAlias(e.target.value)}
            label="new alias"
            focused
          ></TextField>
          <Stack spacing={2} direction="row">
            <Button onClick={handleCancelRename}>Cancel</Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSubmitRename}
            >
              Submit
            </Button>
          </Stack>
        </Stack>
      </Dialog>
    </Box>
  );
};
