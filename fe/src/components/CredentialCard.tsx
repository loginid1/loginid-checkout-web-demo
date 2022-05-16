import {
  alpha,
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import React, { useState } from "react";
import ParseUtil from "../lib/util/parse";
import { Credential } from "../lib/VaultSDK/vault/user";

interface CredentialCard {
  credential: Credential;
  rename?: (id: string, name: string) => Promise<void>;
}

export const CredentialCards: React.FC<CredentialCard> = ({
  credential,
  rename,
}) => {
  const [openRename, setOpenRename] = useState(false);
  const [newName, setNewName] = useState("");
  const credIAT = ParseUtil.parseDate(credential.iat);

  const handleClickRenameCredential = () => {
    setOpenRename(true);
  };

  const handleCancelRename = () => {
    setNewName("");
    setOpenRename(false);
  };

  const handleSubmitRename = async () => {
    if (rename) {
      await rename(credential.id, newName);
    } else {
      console.error("rename not available");
    }
    setOpenRename(false);
  };

  return (
    <Stack
      spacing={2}
      direction="row"
      display="flex"
      sx={{
        width: "100%",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <Box>
        <Typography noWrap variant="h3" align="left" overflow="hidden">
          {credential.name}
        </Typography>
        <Typography noWrap variant="body1" align="left">
          Added {credIAT}
        </Typography>
      </Box>
      {rename && (
        <Stack spacing={2} direction="row">
          <Button variant="outlined" onClick={handleClickRenameCredential}>
            Rename
          </Button>
          {/* <Button variant="outlined" color="error">
            Revoke
          </Button> */}
        </Stack>
      )}
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
            Rename Credential
          </Typography>
          <Typography variant="body1"></Typography>
          <TextField
            fullWidth
            onChange={(e) => setNewName(e.target.value)}
            label="new credential name"
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
    </Stack>
  );
};
