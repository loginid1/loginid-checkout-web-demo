import {
  Box,
  Button,
  CssBaseline,
  Grid,
  Paper,
  Stack,
  ThemeProvider,
  Typography,
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
import { Add, ArrowBack } from "@mui/icons-material";
import { AccountList } from "../../lib/VaultSDK/vault/algo";
import { AlgorandCard } from "../../components/AlgorandCard";
import { VaultBase } from "../../components/VaultBase";

const AlgorandAccounts: React.FC = () => {
  const navigate = useNavigate();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [accountList, setAccountList] = useState<AccountList | null>(null);
  const [username, setUsername] = useState(AuthService.getUsername());

  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    retrieveProfile();
    getAccountList();
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

  async function getAccountList() {
    const token = AuthService.getToken();
    if (token) {
      const accountList = await vaultSDK.getAccountList(token);
      console.log(accountList);
      setAccountList(accountList);
    } else {
    }
  }
  console.log(accountList);

  return (
    <VaultBase focus={1}>
      <Paper
        elevation={0}
        sx={{
          p: 6,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Grid container spacing={2} direction="column">
          <Grid item xs container direction="row" spacing={2}>
            <Grid
              item
              xs={12}
              md={6}
              sx={{
                display: "flex",
                justifyContent: { md: "flex-start", xs: "center" },
              }}
            >
              <Stack spacing={2} direction="row" alignItems={"center"}>
                <Typography variant="h2" color="secondary">
                  Algorand Accounts
                </Typography>
                <Button
                  onClick={() => navigate("/add_algorand_account")}
                  color="primary"
                  variant="contained"
                  sx={{
                    display: { xs: "inherit", md: "none" },
                  }}
                >
                  <Add />
                </Button>
              </Stack>
            </Grid>
            <Grid
              item
              xs={12}
              md={6}
              sx={{
                display: { xs: "none", md: "flex" },
                justifyContent: "flex-end",
              }}
            >
              <Button
                variant="contained"
                onClick={() => navigate("/add_algorand_account")}
              >
                + Create Algorand Account
              </Button>
            </Grid>
            <Grid
              item
              xs={12}
              md={12}
              sx={{
                display: "flex",
                justifyContent: {md: "flex-start", xs: "center"},
                maxWidth: "400px",
              }}
            >
              {accountList?.accounts?.length ? (
                <Typography variant="body1">
                  Your Algorand account(s) are below.
                </Typography>
              ) : (
                <Typography variant="body1">
                  To setup FIDO authentication for Algorand based DApps, start
                  by creating your account.
                </Typography>
              )}
            </Grid>
          </Grid>

          <Grid item xs container direction="column" spacing={2}>
            {accountList?.accounts?.map((account) => (
              <Grid item>
                <AlgorandCard account={account}></AlgorandCard>
              </Grid>
            ))}
          </Grid>
        </Grid>
      </Paper>
    </VaultBase>
  );
};

export default AlgorandAccounts;
