import { Alert, Avatar, Box, Button, Container, createTheme, CssBaseline, Link, TextField, ThemeProvider, Typography } from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import vaultSDK  from '../lib/VaultSDK';
import { AuthService } from '../services/auth';
import { NavigatorError } from '../lib/VaultSDK/utils/errors';


const theme = createTheme();

function Login() {
  
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  let redirect_error = searchParams.get("redirect_error")
  let redirect_url = searchParams.get("redirect_url")
  if(redirect_error == null) {
    redirect_error = '';
  }

  const [username, setUsername] = useState('');
  const [errorMessage, setErrorMessage] = useState(redirect_error);

  async function handleSubmit(e : React.FormEvent) {
    e.preventDefault();
    try {
      const response = await vaultSDK.authenticate(username);
      AuthService.storeSession({username:username,token:response.jwt});
      if (redirect_url != null) {
        navigate(redirect_url);
      } else {
        navigate("/home");
      }
    } catch (error) {
      setErrorMessage((error as Error).message);
    }
  }
  return (
    <ThemeProvider theme={theme}>
      <Container component="main" maxWidth="xs">
        <CssBaseline />
        <Box
          sx={{
            marginTop: 8,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
            <LockOutlinedIcon />
          </Avatar>
          <Typography component="h1" variant="h5">
            Let's log in securely
          </Typography>
          <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
            {errorMessage.length > 0 &&
              <Alert severity="error">{errorMessage}</Alert>
            }
            <TextField
              margin="normal"
              required
              fullWidth
              id="username"
              label="Username"
              name="username"
              autoComplete="username"
              onChange= {e => setUsername(e.target.value)}
              autoFocus
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
            >
              Next 
            </Button>
            <Typography  variant="body1" sx={{ mt: 3, ml: 5, mr: 5 }}>
            Don't have an account? <Link href="./register">Register</Link>
            </Typography>
          </Box>
        </Box>
      </Container>
    </ThemeProvider>
  );
}

export default Login;
