import {
  Alert,
  AlertColor,
  Button,
  Link,
  Paper,
  Snackbar,
  Stack,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { ArrowBack } from "@mui/icons-material";
import vaultSDK from "../../../lib/VaultSDK";
import AddImg from "../../../assets/AddAlgorantAccount.png";
import { ReactComponent as ALgorandLogo } from "../../../assets/AlgorandLogo.svg";
import { useEffect, useState } from "react";
import { AuthService } from "../../../services/auth";
import { VaultBase } from "../../../components/VaultBase";
import { DisplayMessage } from "../../../lib/common/message";

export function QuickAddAlgorand() {
  const navigate = useNavigate();

  const [isCredential, setIsCredential] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const [displayMessage, setDisplayMessage] = useState<DisplayMessage | null>();

  useEffect(() => {}, []);

  async function handleAccountCreation() {
    const token = AuthService.getToken();
    if (token) {
      try {
        const response = await vaultSDK.quickCreateAccount(token);

        navigate("/complete_algorand_account", {
          state: response.address,
        });
      } catch (error) {
        setDisplayMessage({ text: (error as Error).message, type: "error" });
      }
    } else {
      setDisplayMessage({
        text: "missing auth token - retry login",
        type: "error",
      });
      return;
    }
  }

  const handleDisplayClose = (
    event?: React.SyntheticEvent | Event,
    reason?: string
  ) => {
    if (reason === "clickaway") {
      return;
    }
    setDisplayMessage(null);
  };

  return (
    <VaultBase focus={"algo_accounts"}>
      <Paper
        elevation={0}
        sx={{
          p: { md: 4, xs: 2 },
          mb: 2,
          display: "flex",
          justifyContent: "center",
        }}
      >
        {displayMessage && (
          <Snackbar
            open={displayMessage ? true : false}
            autoHideDuration={6000}
            onClose={handleDisplayClose}
          >
            <Alert
              severity={(displayMessage?.type as AlertColor) || "info"}
              sx={{ width: "100%", minWidth: 300 }}
            >
              {displayMessage.text}
            </Alert>
          </Snackbar>
        )}
        <Stack
          spacing={ { md: 4, xs: 2 }}
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
            <Typography variant="body1" display="inline">
              Let’s create your first Algorand account.
            </Typography>
          </Stack>
          <img src={AddImg} alt="Add Algorand" height="auto" />

          <Typography>
            Not ready yet?
            <div />
            Go to <Link onClick={() => navigate("/home")}>Learn more</Link>{" "}
            about Algorand on the Vault
          </Typography>
          <Stack direction="row" spacing={2}>
            <Button onClick={() => navigate("/home")}>
              <ArrowBack />
              &nbsp;Skip
            </Button>

            <Button variant="contained" onClick={handleAccountCreation}>
              Create Account
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </VaultBase>
  );
}
