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
import { useNavigate, useSearchParams, useParams } from "react-router-dom";
import React, { useEffect, useState } from "react";
import { LoginID } from "../theme/theme";
import background from "../assets/background.svg";
import { ReactComponent as VaultLogo } from "../assets/logo.svg";
import { ReactComponent as VaultLogoDev } from "../assets/logo-dev.svg";
import vaultSDK from "../lib/VaultSDK";
import { AuthService } from "../services/auth";
import useWindowDimensions from "../hooks/useWindowDimensions";

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
	const { height } = useWindowDimensions();
  let redirect_error = searchParams.get("redirect_error");
  let redirect_url = searchParams.get("redirect_url");
  if (redirect_error == null) {
    redirect_error = "";
  }

  const params = useParams();
  const isDeveloper = params["entry"] === 'developer';

  const [username, setUsername] = useState("");
  const [errorMessage, setErrorMessage] = useState(redirect_error);


  useEffect(() => {
    let redirect_url = searchParams.get("redirect_url");
    let u = searchParams.get("u");
    if (u!= null){
      setUsername(u);
    }
	}, []);

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
          height: `${height}px`,
        }}
      >
        <Paper
          elevation={0}
          sx={{
            p: { sm: 4, xs: 2 },
            borderRadius: "2%",
            width: { sm: '400px', xs: '100%' }
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
            { isDeveloper ? <VaultLogoDev /> : <VaultLogo /> }
            <Typography variant="body1" marginTop={2}>
              Access securely to your LoginID Wallet Account.
            </Typography>
            {errorMessage.length > 0 && (
              <Alert severity="error">{errorMessage}</Alert>
            )}
            <TextField
              fullWidth
              label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
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
              <Link href={redirect_url?"./register?redirect_url="+redirect_url:"./register"}>Register</Link>
            </Typography>
            <Typography variant="body1">
              Are you a developer?{" "}
              <Link href={redirect_url?"./developer/register?redirect_url="+redirect_url:"./developer/register"}>Developer Account</Link>
            </Typography>
          </Stack>
        </Paper>
      </Container>
    </ThemeProvider>
  );
};

export default Login;
