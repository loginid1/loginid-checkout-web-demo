import {
  Box,
  Button,
  Checkbox,
  CssBaseline,
  FormControlLabel,
  Grid,
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
import { RecoveryPhrase } from "../../lib/VaultSDK/vault/user";
import {KeyDisplay} from "../../components/KeyDisplay";
import { useState } from "react";

const CompleteRecovery: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const recovery = location.state as RecoveryPhrase;

  const [isChecked, setIsChecked] = useState(false);

  const copyPublicKey = () => {
    navigator.clipboard.writeText(recovery.public_key);
  };

  const copyPrivateKey = () => {
    navigator.clipboard.writeText(recovery.private_key);
  };

  return (
    <ThemeProvider theme={LoginID}>
      <Box
        sx={{
          display: "flex",
        }}
      >
        <CssBaseline />
        <Menu focus={0}/>

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
                    spacing={4}
                    direction="column"
                    alignItems="center"
                    justifyContent="space-evenly"
                  >
                    <Typography variant="h2" color="secondary">
                      New Recovery Option
                    </Typography>
                    <Stack spacing={2}>
                      <Typography variant="medium">Recovery Address</Typography>
               ``       <KeyDisplay
                        value={recovery.public_key}
                        onClick={copyPublicKey}
                      />
                    </Stack>
                    <Stack spacing={2} direction="column" alignItems="center">
                      <Typography variant="medium">Passphrase</Typography>
                      <Box maxWidth="400px">
                        <Typography variant="body1" display="inline">
                          Please write down the following words and store them
                          in a safe place as they can not be recovered.
                        </Typography>
                        <Typography
                          color="secondary"
                          fontWeight={700}
                          display="inline"
                        >
                          We do not store your mnemonic phrase and can not help
                          you recover it.
                        </Typography>
                      </Box>
                      <KeyDisplay
                        color="error"
                        value={recovery.private_key}
                        onClick={copyPrivateKey}
                      />
                      <FormControlLabel
                        control={
                          <Checkbox value={isChecked} onChange={(e) => setIsChecked(e.target.checked)} />
                        }
                        label="I confirm that I saved and secured my passphrase"
                      />
                    </Stack>

                    <Stack direction="row" spacing={2}>
                      <Button onClick={() => navigate("/add_recovery")}>
                        <ArrowBack />
                        &nbsp;Back
                      </Button>

                      <Button
                        variant="outlined"
                        onClick={() => navigate("/home")}
                        disabled={!isChecked}
                      >
                        Return To Main Menu
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

export default CompleteRecovery;
