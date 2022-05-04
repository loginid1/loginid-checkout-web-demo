import {
  Alert,
  Box,
  Button,
  CssBaseline,
  Link,
  TextField,
  ThemeProvider,
  Typography,
} from "@mui/material";
import { useNavigate, useSearchParams } from "react-router-dom";
import React, { useState } from "react";
import { LoginID } from "../theme/theme";
import background from "../assets/background.svg";
import vaultLogo from "../assets/logo.svg";
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
            padding: 10,
            borderRadius: "2%",
            backgroundColor: "white",
            maxWidth: "50vx",
          }}
        >
          <img src={vaultLogo} alt="logo"></img>
          <Typography variant="body1" marginTop={2}>
            Log in securely to your FIDO Vault Account.
          </Typography>

          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{ mt: 4, maxWidth: "250px" }}
          >
            {errorMessage.length > 0 && (
              <Alert severity="error">{errorMessage}</Alert>
            )}
            <TextField
              margin="normal"
              fullWidth
              id="username"
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
          </Box>
          <Typography variant="body1">
            Don't have an account yet?{" "}
            <Link href="./register">Create Account Now</Link>
          </Typography>
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default Login;
