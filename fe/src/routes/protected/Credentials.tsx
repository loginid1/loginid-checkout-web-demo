import {
  Box,
  CssBaseline,
  Grid,
  Paper,
  ThemeProvider,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Profile } from "../../lib/VaultSDK/vault/user";
import { AuthService } from "../../services/auth";
import { LoginID } from "../../theme/theme";
import { Menu } from "../../components/Menu";
import VaultAppBar from "../../components/VaultAppbar";
import { CredentialsManage } from "../../components/CredentialsManage";
import { RecoveryManage } from "../../components/RecoveryManage";
import vaultSDK from "../../lib/VaultSDK";

const Credentials: React.FC = () => {
  const navigate = useNavigate();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [username, setUsername] = useState(AuthService.getUsername());
  const [errorMessage, setErrorMessage] = useState("");

	useEffect(() => {
		retrieveProfile();
	}, []);

	async function retrieveProfile() {
		const token = AuthService.getToken();
		if (token) {
			const myProfile = await vaultSDK.getProfile(token);
			setProfile(myProfile);
		} else {
			// redirect to login
			navigate(
				"/login?redirect_error=" +
					encodeURIComponent("not authorized - please login again")
			);
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
              paddingRight: "",
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
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <CredentialsManage />
                </Paper>
              </Grid>
              <Grid item xs={12} md={12} lg={12}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 6,
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <RecoveryManage />
                </Paper>
              </Grid>
            </Grid>
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default Credentials;
