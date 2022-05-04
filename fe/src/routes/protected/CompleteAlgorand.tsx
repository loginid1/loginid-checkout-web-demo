import {
  Box,
  Button,
  CssBaseline,
  Grid,
  Link,
  Paper,
  Stack,
  TextField,
  ThemeProvider,
  Typography,
} from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import { Menu } from "../../components/Menu";
import VaultAppBar from "../../components/VaultAppbar";
import { LoginID } from "../../theme/theme";
import { ArrowBack } from "@mui/icons-material";
import vaultSDK from "../../lib/VaultSDK";
import { ReactComponent as ALgorandLogo } from "../../assets/AlgorandLogo.svg";
import { useEffect, useState } from "react";
import { AuthService } from "../../services/auth";
import { KeyDisplay } from "../../components/KeyDisplay";
import { VaultBase } from "../../components/VaultBase";

const CompleteAlgorand: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const address = location.state as string;

  return (
    <VaultBase focus={1}>
      <Paper
        elevation={0}
        sx={{
          p: 6,
          mb: 2,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <Stack
          spacing={6}
          maxWidth="400px"
          alignItems="center"
          justifyContent="space-evenly"
        >
          <Stack spacing={2} alignItems="center">
            <ALgorandLogo />
            <Typography variant="h2" color="secondary">
              Create Algorand Account
            </Typography>
          </Stack>
          <Stack spacing={2} alignItems="center">
            <Typography variant="body1">
              Your new Algorand account has been created! To activate your
              account, please go to your wallet and transfer funds to the
              account below.
            </Typography>
          </Stack>

          <Stack spacing={2} alignItems="center">
            <Typography variant="h3">Account Address</Typography>
            <KeyDisplay color="error" value={address} />
          </Stack>

          <Button
            variant="contained"
            onClick={() => navigate("/algorand_account_success")}
          >
            Complete
          </Button>
          <Link color="#000" onClick={() => navigate("/algorand_accounts")}>
            I will activate later
          </Link>
        </Stack>
      </Paper>
    </VaultBase>
  );
};

export default CompleteAlgorand;
