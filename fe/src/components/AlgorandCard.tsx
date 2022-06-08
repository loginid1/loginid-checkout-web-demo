import {
  Alert,
  alpha,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import React, { useState } from "react";
import { Recovery } from "../lib/VaultSDK/vault/user";
import { LoginID } from "../theme/theme";
import {
  ArrowDropDown,
  ContentCopy,
  NavigateNextTwoTone,
} from "@mui/icons-material";
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
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const accountIAT = ParseUtil.parseDate(account.iat);
  const cutAddress = ParseUtil.displayLongAddress(account.address);
  const copyAddress = () => {
    navigator.clipboard.writeText(account.address);
  };
  const open = Boolean(anchorEl);

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
    navigate("/rekey_algorand/" + address);
  }

  function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
    setAnchorEl(event.currentTarget);
  }

  function handleClose() {
    setAnchorEl(null);
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
              <Stack direction="row" spacing={4} alignItems="center">
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
                    fontSize="12px"
                  >
                    {cutAddress}
                  </Typography>
                  <IconButton size="small" onClick={copyAddress}>
                    <ContentCopy />
                  </IconButton>
                </Stack>
              </Stack>
              {/* <Alert severity="error">This is an error alert — check it out!</Alert> */}

              <Typography variant="body1" align="left" fontSize="12px">
                Added {accountIAT}
              </Typography>
              {account.recovery_address && (
                <Typography variant="body1" align="left" fontSize="12px">
                  Recovery option:{" "}
                  <Chip
                    sx={{ backgroundColor: "#E2F2FF" }}
                    size="small"
                    label={cutoff(account.recovery_address)}
                  />
                </Typography>
              )}
              <Typography variant="body1" align="left" fontSize="12px">
                Credentials:{" "}
                {account.credentials_name.map((name) => (
                  <Chip
                    sx={{ backgroundColor: "#E2F2FF" }}
                    size="small"
                    label={name}
                  />
                ))}
              </Typography>
              {account.balance && (
                <>
                  <Typography noWrap variant="body1" align="left" fontSize="12px">
                    Balance:{" "}
                    <Chip
                      sx={{ backgroundColor: "#E2F2FF" }}
                      size="small"
                      label={account.balance?.amount + " mAlgo"}
                    />
                  </Typography>
                  <Typography variant="body1" align="left" fontSize="12px">
                    Current:{" "}
                    <Chip
                      sx={{ backgroundColor: "#E2F2FF" }}
                      size="small"
                      label={account.balance?.current_round}
                    />
                  </Typography>
                  <Typography variant="body1" align="left" fontSize="12px">
                    Status:{" "}
                    <Chip
                      sx={{ backgroundColor: "#E2F2FF" }}
                      size="small"
                      label={account.balance?.status}
                    />
                  </Typography>
                </>
              )}
            </Box>
            <Stack display={{ display: "flex", justifyContent: "center" }}>
              <Button
                variant="outlined"
                color="primary"
                aria-controls={open ? "basic-menu" : undefined}
                aria-haspopup="true"
                aria-expanded={open ? "true" : undefined}
                onClick={handleClick}
              >
                Options <ArrowDropDown />
              </Button>
              <Menu
                id="basic-menu"
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
              >
                <MenuItem onClick={handleClickRenameAccount} color="primary">
                  Change Alias
                </MenuItem>
                <MenuItem
                  onClick={() => handleClickTransaction(account.address)}
                  color="primary"
                >
                  Transaction
                </MenuItem>
                <MenuItem
                  onClick={() => handleClickRekey(account.address)}
                  color="primary"
                >
                  Rekey
                </MenuItem>
              </Menu>
            </Stack>
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
