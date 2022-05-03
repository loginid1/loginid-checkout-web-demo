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
import { Credentials, RecoveryList } from "../lib/VaultSDK/vault/user";
import { AuthService } from "../services/auth";
import { CredentialCards } from "./CredentialCard";
import { RecoveryCard } from "./RecoveryCard";

export const RecoveryManage: React.FC = () => {
  const navigate = useNavigate();

  const [recoveryList, setRecoveryList] = useState<RecoveryList | null>(null);

  useEffect(() => {
    retrieveRecoveryList();
  }, []);

  async function retrieveRecoveryList() {
    const token = AuthService.getToken();
    if (token) {
      const recoveryList = await vaultSDK.getRecoveryList(token);
      setRecoveryList(recoveryList);
    } else {
    }
  }

  return (
    <Grid container spacing={2} direction="column">
      <Grid item xs container direction="row" spacing={2}>
        <Grid
          item
          xs={6}
          sx={{ display: "flex", justifyContent: "flex-start" }}
        >
          <Typography variant="h2" color="secondary">Recovery Options</Typography>
        </Grid>
        <Grid item xs={6} sx={{ display: "flex", justifyContent: "flex-end" }}>
          <Button variant="contained" onClick={() => navigate("/add_recovery")}>
            + Add New Recovery Option
          </Button>
        </Grid>
        <Grid
          item
          xs={6}
          sx={{ display: "flex", justifyContent: "flex-start" }}
        >
          <Typography variant="body1">
            This feature will allow you to regain access to your account if you
            lose/upgrade your credentials.
          </Typography>
        </Grid>
      </Grid>
      <Grid item xs container direction="column" spacing={2}>
        {recoveryList?.recovery?.map((recovery) => (
          <Grid item>
            <Card
              variant="outlined"
              sx={{ width: "100%", backgroundColor: alpha("#F2F2F2", 0.2) }}
              elevation={0}
            >
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <RecoveryCard recovery={recovery}></RecoveryCard>
                  <Box>
                    <Stack direction="row" spacing={2}>
                      <Button variant="outlined" color="error">
                        Revoke
                      </Button>
                      <Button variant="outlined" color="primary">
                        Show Details
                      </Button>
                      <Button variant="outlined" color="primary">
                        Rephrase
                      </Button>
                    </Stack>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Grid>
  );
};
