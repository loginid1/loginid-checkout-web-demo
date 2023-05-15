import { Paper } from "@mui/material";
import React, { useState } from "react";
import { RecoveryManage } from "../../../components/RecoveryManage";
import { VaultBase } from "../../../components/VaultBase";

export const AlgorandRecovery: React.FC = () => {
  const [errorMessage, setErrorMessage] = useState("");

  return (
    <VaultBase focus={"algo_recovery"}>
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

export default AlgorandRecovery;
