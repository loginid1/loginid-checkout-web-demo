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
import CompleteImg from "../../assets/CompleteCredential.png";
import { ArrowBack } from "@mui/icons-material";
import vaultSDK from "../../lib/VaultSDK";
import { useState } from "react";
import { RecoveryPhrase } from "../../lib/VaultSDK/vault/user";
import { AuthService } from "../../services/auth";

const AddRecovery: React.FC = () => {
  const navigate = useNavigate();

  const [recovery, setRecovery] = useState<RecoveryPhrase | null>(null);

  async function handleCreateRecovery() {
    const token = AuthService.getToken();
    if (token) {
        const recovery = await vaultSDK.createRecovery(token);
        setRecovery(recovery);
        navigate("/complete_recovery", {
            state: recovery
        })
    } else {
    }
}
  return (
    <ThemeProvider theme={LoginID}>
      <Box
        sx={{
          display: "flex",
        }}
      >
        <CssBaseline />
        <Menu />

        <Box
          component="main"
          sx={{
            flexGrow: 1,
            height: "100vh",
            paddingX: 4,
          }}
        >
          <Box
            sx={{
              height: "100%",
              width: "100%",
              mt: 2,
            }}
          >
            <Grid container spacing={2} marginRight={10}>
              <Grid item xs={12} md={12} lg={12}>
                <VaultAppBar />
              </Grid>
              <Grid item xs={12} md={12} lg={12}>
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
                    direction="column"
                    maxWidth="400px"
                    alignItems="center"
                    justifyContent="space-evenly"
                  >
                    <Typography variant="h2" color="secondary">
                      Add New Recovery Option
                    </Typography>
                    <Typography variant="body1">
                      Recovery options will allow you to regain access to your
                      account if you lose or upgrade your credentials.
                    </Typography>
                    <Stack direction="row" spacing={2}>
                      <Button onClick={() => navigate("/home")}>
                        <ArrowBack />
                        &nbsp;Back
                      </Button>

                      <Button
                        variant="contained"
                        onClick={handleCreateRecovery}
                      >
                        Next
                      </Button>
                    </Stack>
                  </Stack>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default AddRecovery;
