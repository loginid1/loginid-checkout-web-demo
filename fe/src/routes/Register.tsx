import {
  Alert,
  Box,
  Button,
  Checkbox,
  Container,
  CssBaseline,
  FormControlLabel,
  Link,
  Paper,
  Stack,
  TextField,
  ThemeProvider,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import React, { useState } from "react";
import { LoginID } from "../theme/theme";
import background from "../assets/background.svg";
import { ReactComponent as VaultLogo } from "../assets/logo.svg";
import vaultSDK from "../lib/VaultSDK";
import { AuthService } from "../services/auth";
import { CodeInput } from "../components/CodeInput";

//export const Register: React.FC = () => {
export default function Register() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [regCode, setRegCode] = useState("");
  const [showCode, setShowCode] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");

  const handleNewDevice = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setShowCode(true);
    } else {
      setShowCode(false);
      setRegCode("");
    }
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (showCode) {
        const response = await vaultSDK.addCredential(username, regCode);
        AuthService.storeSession({ username: username, token: response.jwt });
        navigate("/home");
      } else {
        const response = await vaultSDK.register(username);
        AuthService.storeSession({ username: username, token: response.jwt });
        navigate("/quick_add_algorand");
      }
    } catch (error) {
      setErrorMessage((error as Error).message);
    }
  };

  function validateCode(code: string) {
    let pattern = new RegExp("^[0-9]+$|^$");
    if (pattern.test(code)) {
      console.log("code");
      setRegCode(code);
    }
  }

  return (
    <ThemeProvider theme={LoginID}>
      <CssBaseline />
      <Container
        component="main"
        maxWidth={false}
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          backgroundImage: `url(${background})`,
          height: `${window.innerHeight}px`,
        }}
      >
        <Paper
          elevation={0}
          sx={{
            p: { md: 6, xs: 2 },
            borderRadius: "2%",
          }}
        >
          <Stack
            component="form"
            onSubmit={handleSubmit}
            spacing={2}
            sx={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <VaultLogo />
            <Typography variant="body1" marginTop={2} maxWidth="400px">
              Create a FIDO Vault Account and manage your Crypto Accounts with
              Security and Ease.
            </Typography>
            {errorMessage.length > 0 && (
              <Alert severity="error">{errorMessage}</Alert>
            )}
            <TextField
              fullWidth
              label="Username"
              value={username}
              focused
              onChange={(e) => setUsername(e.target.value)}
            />
            <FormControlLabel
              control={
                <Checkbox
                  value="addDevice"
                  color="primary"
                  onChange={handleNewDevice}
                />
              }
              label="I would like to add this device to my credentials"
            />
            {showCode && (
              <Stack spacing={2}>
                <Typography variant="body1" maxWidth="400px">
                  Please enter the 6-digit code generated from your
                  FIDO-registered device.
                </Typography>
                <CodeInput inputName="code" validateCode={validateCode} />
              </Stack>
            )}
            <Button
              type="submit"
              variant="contained"
              size="large"
              sx={{ mt: 3, mb: 2 }}
            >
              Create Account
            </Button>
            <Typography variant="body1">
              Already have an account? <Link href="./login">Login</Link>
            </Typography>
          </Stack>
        </Paper>
      </Container>
    </ThemeProvider>
  );
}
