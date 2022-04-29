import {
  Box,
  Container,
  CssBaseline,
  Divider,
  Drawer,
  Grid,
  IconButton,
  List,
  Paper,
  ThemeProvider,
  Toolbar,
} from "@mui/material";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Profile } from "../../lib/VaultSDK/vault/user";
import { AuthService } from "../../services/auth";
import { LoginID } from "../../theme/theme";
import background from "../../assets/background.svg";
import { Menu } from "../../components/Menu";
import VaultAppBar from "../../components/VaultAppbar";
import { CredentialsManage } from "../../components/CredentialsManage";

const Credentials: React.FC = () => {
  const navigate = useNavigate();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [username, setUsername] = useState(AuthService.getUsername());
  const [errorMessage, setErrorMessage] = useState("");

  return (
    <ThemeProvider theme={LoginID}>
      <Box
        sx={{
          display: "flex",
        }}
      >
        <CssBaseline />
        <Menu />

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
                  sx={{
                    p: 4,
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <CredentialsManage />
                </Paper>
              </Grid>
              <Grid item xs={12} md={12} lg={12}>
                <Paper
                  sx={{
                    p: 2,
                    display: "flex",
                    flexDirection: "column",
                    height: 240,
                  }}
                >
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
