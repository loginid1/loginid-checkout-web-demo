import {
  Box,
  Button,
  CssBaseline,
  Grid,
  Link,
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
import SuccessImg from "../../assets/AlgorandSuccess.png";
import { ReactComponent as ALgorandLogo } from "../../assets/AlgorandLogo.svg";
import { useEffect, useState } from "react";
import { AuthService } from "../../services/auth";
import { VaultBase } from "../../components/VaultBase";

const AlgorandSuccess: React.FC = () => {
  const navigate = useNavigate();

  const [isCredential, setIsCredential] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);

  useEffect(() => {
    retrieveLists();
  }, []);

  async function retrieveLists() {
    const token = AuthService.getToken();
    if (token) {
      const myCredentials = await vaultSDK.getCredentials(token);
      const recoveryList = await vaultSDK.getRecoveryList(token);

      setIsCredential(myCredentials.credentials.length > 0);
      setIsRecovery(recoveryList.recovery.length > 0);
    } else {
    }
  }

  return (
    <VaultBase focus={1}>
      <Paper
        elevation={0}
        sx={{
          p: { md: 4, xs: 2 },
          mb: 2,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <Stack
          spacing={{ md: 4, xs: 2 }}
          maxWidth="400px"
          alignItems="center"
          justifyContent="space-evenly"
        >
          <Stack spacing={2} alignItems="center">
            <ALgorandLogo />
            <Typography variant="h2" color="secondary">
              Algorand Account Created
            </Typography>
          </Stack>
          <Stack spacing={2} alignItems="center">
            <Typography variant="body1" display="inline">
              Congratulations! You have successfully created and activated your
              new Algorand account.
            </Typography>
          </Stack>
          <img src={SuccessImg} alt="Successful Algorand Account Creation" />

          <Button
            variant="contained"
            onClick={() => navigate("/algorand_accounts")}
          >
            Return to Main Menu
          </Button>
        </Stack>
      </Paper>
    </VaultBase>
  );
};

export default AlgorandSuccess;
