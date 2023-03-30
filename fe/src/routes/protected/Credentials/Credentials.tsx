import { Paper } from "@mui/material";
import React, { useState } from "react";
import { CredentialsManage } from "../../../components/CredentialsManage";
import { RecoveryManage } from "../../../components/RecoveryManage";
import { VaultBase } from "../../../components/VaultBase";

const Credentials: React.FC = () => {
  const [errorMessage, setErrorMessage] = useState("");

  return (
    <VaultBase focus={"passkeys"}>
      <Paper
        elevation={0}
        sx={{
          p: { md: 4, xs: 2 },
          display: "flex",
          flexDirection: "column",
        }}
      >
        <CredentialsManage />
      </Paper>
      <Paper
        elevation={0}
        sx={{
          p: { md: 4, xs: 2 },
          display: "flex",
          flexDirection: "column",
        }}
      >
        <RecoveryManage />
      </Paper>
    </VaultBase>
  );
};

export default Credentials;
