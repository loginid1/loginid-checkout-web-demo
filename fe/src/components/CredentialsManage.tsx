import {
  alpha,
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import vaultSDK from "../lib/VaultSDK";
import { Credentials } from "../lib/VaultSDK/vault/user";
import { AuthService } from "../services/auth";
import { CredentialCards } from "./CredentialCard";

export const CredentialsManage: React.FC = () => {
  const navigate = useNavigate();

  const [credentials, setCredentials] = useState<Credentials | null>(null);

  useEffect(() => {
    retrieveCredentials();
  }, []);

  async function retrieveCredentials() {
    const token = AuthService.getToken();
    if (token) {
      const myCredentials = await vaultSDK.getCredentials(token);
      setCredentials(myCredentials);
    } else {
    }
  }

  return (
    <Grid container spacing={2} direction="column">
      <Grid item xs container direction="row" spacing={1}>
        <Grid
          item
          xs={6}
          sx={{ display: "flex", justifyContent: "flex-start" }}
        >
          <Typography variant="h2" color="secondary">My Credentials</Typography>
        </Grid>
        <Grid item xs={6} sx={{ display: "flex", justifyContent: "flex-end" }}>
          <Button
            variant="contained"
            onClick={() => navigate("/add_credential")}
          >
            + Add New Credential
          </Button>
        </Grid>
        <Grid
          item
          xs={6}
          sx={{ display: "flex", justifyContent: "flex-start" }}
        >
          <Typography variant="body1">
            Credentials are a combination of browsers and devices used to give
            you access to your account.
          </Typography>
        </Grid>
      </Grid>
      <Grid item xs container direction="row" spacing={2}>
        {credentials?.credentials?.map((credential) => (
          <Grid item>
            <Card
              variant="outlined"
              sx={{ width: "100", backgroundColor: alpha("#F2F2F2", 0.2) }}
              elevation={0}
            >
              <CardContent>
                <Stack spacing={2} alignItems="start">
                  <CredentialCards credential={credential}></CredentialCards>{" "}
                  {/* <Button variant="outlined" color="error">
                    Revoke
                  </Button> */}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Grid>
  );
};
