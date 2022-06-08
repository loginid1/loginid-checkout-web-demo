import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  CssBaseline,
  Link,
  Paper,
  Stack,
  TextField,
  ThemeProvider,
  Typography,
} from "@mui/material";
import { useNavigate, useSearchParams } from "react-router-dom";
import React, { useState } from "react";
import { LoginID } from "../theme/theme";
import background from "../assets/background.svg";
import { ReactComponent as VaultLogo } from "../assets/logo.svg";
import vaultSDK from "../lib/VaultSDK";
import { AuthService } from "../services/auth";

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  let redirect_error = searchParams.get("redirect_error");
  let redirect_url = searchParams.get("redirect_url");
  if (redirect_error == null) {
    redirect_error = "";
  }

  const [username, setUsername] = useState("");
  const [errorMessage, setErrorMessage] = useState(redirect_error);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await vaultSDK.authenticate(username);
      AuthService.storeSession({ username: username, token: response.jwt });
      if (redirect_url != null) {
        navigate(redirect_url);
      } else {
        navigate("/home");
      }
    } catch (error) {
      setErrorMessage((error as Error).message);
    }
  };
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
            <Typography variant="body1" marginTop={2}>
              Log in securely to your FIDO Vault Account.
            </Typography>
            {errorMessage.length > 0 && (
              <Alert severity="error">{errorMessage}</Alert>
            )}
            <TextField
              fullWidth
              label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              focused
            />
            <Button
              type="submit"
              variant="contained"
              size="large"
              sx={{ mt: 4, mb: 2 }}
            >
              Login
            </Button>
            <Typography variant="body1">
              Don't have an account yet?{" "}
              <Link href="./register">Create Account Now</Link>
            </Typography>
            <Typography variant="body1">
              Returned user with a new device? <Link href="./add_device">Click Here</Link>
            </Typography>
          </Stack>
        </Paper>
      </Container>
    </ThemeProvider>
  );
};

export default Login;
