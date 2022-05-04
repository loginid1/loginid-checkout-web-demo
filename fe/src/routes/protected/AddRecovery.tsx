import {
  Box,
  Button,
  CssBaseline,
  Grid,
  Paper,
  Stack,
  ThemeProvider,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { Menu } from "../../components/Menu";
import VaultAppBar from "../../components/VaultAppbar";
import { LoginID } from "../../theme/theme";
import { ArrowBack } from "@mui/icons-material";
import vaultSDK from "../../lib/VaultSDK";
import { useState } from "react";
import { RecoveryPhrase } from "../../lib/VaultSDK/vault/user";
import { AuthService } from "../../services/auth";
import { VaultBase } from "../../components/VaultBase";

const AddRecovery: React.FC = () => {
  const navigate = useNavigate();

  async function handleCreateRecovery() {
    const token = AuthService.getToken();
    if (token) {
      const recovery = await vaultSDK.createRecovery(token);
      navigate("/complete_recovery", {
        state: recovery,
      });
    } else {
    }
  }
  return (
    <VaultBase focus={0}>
      <Paper
        elevation={0}
        sx={{
          p: { md: 4, xs: 2 },
          display: "flex",
          justifyContent: "center",
        }}
      >
        <Stack
          spacing={{ md: 4, xs: 2 }}
          direction="column"
          maxWidth="400px"
          alignItems="center"
          justifyContent="space-evenly"
        >
          <Typography variant="h2" color="secondary">
            Add New Recovery Option
          </Typography>
          <Typography variant="body1">
            Recovery options will allow you to regain access to your account if
            you lose or upgrade your credentials.
          </Typography>
          <Stack direction="row" spacing={2}>
            <Button onClick={() => navigate("/home")}>
              <ArrowBack />
              &nbsp;Back
            </Button>

            <Button variant="contained" onClick={handleCreateRecovery}>
              Next
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </VaultBase>
  );
};

export default AddRecovery;
