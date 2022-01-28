import React, {useState} from 'react';

import { useNavigate } from 'react-router-dom';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { Alert, Avatar, Box, Button, Checkbox, Container, CssBaseline, FormControlLabel, Grid, Link, TextField, Typography } from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import vaultSDK from '../lib/VaultSDK';
import authidIframeHandler from '../lib/VaultSDK/utils/authid';

import { AuthService } from '../services/auth';

const theme = createTheme();

function Signup() {
  const navigate = useNavigate();
  

  const [username, setUsername] = useState('');
  const [regCode, setRegCode] = useState('');
  const [showCode, setShowCode] = useState(false);
  const [addDevice, setAddDevice] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  function handleNewDevice(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.checked) {
      setShowCode(true);
    } else {
      setShowCode(false);
      setRegCode("");
    }
  }

  async function handleSubmit(e : React.FormEvent) {
    e.preventDefault();
    try {
      if (showCode) {
        setErrorMessage("feature not supported yet!")
      } else {
        const response = await vaultSDK.register(username);
        AuthService.storeSession({username:username,token:response.jwt});
        navigate("/home");
      }
    } catch (error) {
      setErrorMessage((error as Error).message);
    }
  };

  function validateCode(e : React.ChangeEvent<HTMLInputElement>) {
    let code = e.target.value;
    let pattern = new RegExp("^[0-9]+$|^$");
    if (pattern.test(code)) {
      console.log("code");
      setRegCode(code);
    } else {
      e.preventDefault();
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
            Create Your Account
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
              onChange= {e => setUsername(e.target.value)}
            />
            <FormControlLabel
              control={<Checkbox value="addDevice" color="primary" onChange= {handleNewDevice}/>}
              label="Add this device to my existing account"
            />
            { showCode &&

              <TextField
                margin="normal"
                required
                fullWidth
                id="regCode"
                label="Code"
                name="regCode"
                InputProps={{ inputProps: { inputMode: 'numeric', pattern: '[0-9]{6}', maxLength: 6 } }}
                helperText = "Enter six digits registration code"
                value={regCode}
                onChange= {validateCode}
              />

            }
            <Typography  variant="body1" sx={{ mt: 3, ml: 5, mr: 5 }}>
            By clicking 'Next', I agree to the <Link>terms of service</Link>
            </Typography>
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
            >
              Next 
            </Button>

            <Typography  variant="body1" sx={{ mt: 3, ml: 5, mr: 5 }}>
            Already have an account? <Link href="./login">Login</Link>
            </Typography>
          </Box>
        </Box>
      </Container>
    </ThemeProvider>

  );
}

export default Signup;
