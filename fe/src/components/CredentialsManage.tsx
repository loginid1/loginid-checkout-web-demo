import { Box, Button, Grid, Paper, Typography } from "@mui/material";
import React from "react";

export const CredentialsManage: React.FC = () => {
  return (
    <Grid container spacing={2} direction="column">
      <Grid item xs container direction="row" spacing={2}>
        <Grid
          item
          xs={6}
          sx={{ display: "flex", justifyContent: "flex-start" }}
        >
          <Typography variant="h1">My Credentials</Typography>
        </Grid>
        <Grid item xs={6} sx={{ display: "flex", justifyContent: "flex-end" }}>
          <Button variant="contained">+ Add New Credential</Button>
        </Grid>
        <Grid item xs={6} sx={{ display: "flex", justifyContent: "flex-start" }}>
          <Typography variant="body2">
            Credentials are a combination of browsers and devices used to give
            you access to your account.
          </Typography>
        </Grid>
        <Grid item></Grid>
      </Grid>
      <Grid item xs container direction="row" spacing={2}>
        
      </Grid>
    </Grid>
  );
};
