import {
  Alert,
  Box,
  Button,
  Checkbox,
  CssBaseline,
  FormControlLabel,
  Link,
  TextField,
  ThemeProvider,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import React, { useState } from "react";
import { LoginID } from "../theme/theme";
import background from "../assets/background.svg";
import logo from "../assets/logo.svg";
import vaultSDK from "../lib/VaultSDK";
import { AuthService } from "../lib//auth";
import { CodeInput } from "../components/CodeInput";

export const Register: React.FC = () => {
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
        navigate("/home");
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
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          backgroundImage: `url(${background})`,
        }}
      >
        <CssBaseline />
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "60px",
            borderRadius: "2%",
            backgroundColor: "white",
            maxWidth: "520px",
          }}
        >
          <img src={logo} alt="logo" />
          <Typography variant="body1" marginTop={2}>
            Create a FIDO Vault Account and manage your Crypto Accounts with
            Security and Ease.
          </Typography>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            {errorMessage.length > 0 && (
              <Alert severity="error">{errorMessage}</Alert>
            )}
            <Box sx={{ mt: 2, mb: 2 }}>
              <TextField
                id="username"
                label="Username"
                value={username}
                color="primary"
                focused
                sx={{width: "250px"}}
                onChange={(e) => setUsername(e.target.value)}
              />
            </Box>
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
              <Box sx={{ mt: 2 }}>
                <Typography variant="body1">
                  Please enter the 6-digit code generated from your
                  FIDO-registered device.
                </Typography>
                <CodeInput inputName="code" validateCode={validateCode} />
              </Box>
            )}
            <div></div>
            <Button
              type="submit"
              variant="contained"
              size="large"
              sx={{ mt: 3, mb: 2 }}
            >
              Create Account
            </Button>
          </Box>
          <Typography variant="body1">
            Already have an account? <Link href="./login">Login</Link>
          </Typography>
        </Box>
      </Box>
    </ThemeProvider>
  );
};
