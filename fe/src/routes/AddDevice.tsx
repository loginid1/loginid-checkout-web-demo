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
import { useNavigate, useSearchParams } from "react-router-dom";
import React, { useEffect, useState } from "react";
import { LoginID } from "../theme/theme";
import background from "../assets/background.svg";
import { ReactComponent as VaultLogo } from "../assets/logo.svg";
import vaultSDK from "../lib/VaultSDK";
import { AuthService } from "../services/auth";
import { CodeInput } from "../components/CodeInput";

export default function AddDevice() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [regCode, setRegCode] = useState("");

  const [errorMessage, setErrorMessage] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();
  let redirect_url = searchParams.get("redirect_url");
  useEffect(()=>{
    let aname = searchParams.get("username");
    setUsername(aname || "");

  },[]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await vaultSDK.addCredential(username, regCode);
      AuthService.storeSession({ username: username, token: response.jwt });
      AuthService.storePref({username:username});
      navigate("/home");
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
              Add the current device to your existing FIDO Vault account
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
            <Stack spacing={2}>
              <Typography variant="body1" maxWidth="400px">
                Please enter the 6-digit code generated from your
                FIDO-registered device.
              </Typography>
              <CodeInput inputName="code" validateCode={validateCode} />
            </Stack>
            <Button
              type="submit"
              variant="contained"
              size="large"
              sx={{ mt: 3, mb: 2 }}
            >
              Add This Device
            </Button>
            <Typography variant="body1">
              Already have an account? <Link href={redirect_url?"./login?redirect_url="+redirect_url:"./login"}>Login</Link>
            </Typography>
            <Typography variant="body1">
              Don't have an account yet?{" "}
              <Link href={redirect_url?"./login?redirect_url="+redirect_url:"./"}>Create Account Now</Link>
            </Typography>
          </Stack>
        </Paper>
      </Container>
    </ThemeProvider>
  );
}
