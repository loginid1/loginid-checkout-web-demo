import { Button, Card, Link, Stack, Typography } from "@mui/material";
import { LoginID } from "../theme/theme";
import React from "react";
import { ThemeProvider } from "@emotion/react";
import { Box, styled } from "@mui/system";

interface AccountProp {
  name?: string;
  add_date?: Date;
  edit_date?: Date;
}

export const Account: React.FC<AccountProp> = ({}) => {
  return (
    <ThemeProvider theme={LoginID}>
      <Box
        sx={{
          display: "flex",
          paddingX: "20px",
          paddingY: "16px",
          width: "720px",
          height: "76px",
          alignItems: "center",
          border: 1,
          borderRadius: "5px",
        }}
      >
        <Stack spacing={1}>
          <Typography variant="h5">MyAlgorandAccount</Typography>
          <Typography variant="h6">added at some date</Typography>
        </Stack>
        <Box ml={"auto"}>
          <Stack spacing={2} direction="row">
            <Button variant="outlined">PUBLIC KEY</Button>
            <Button variant="outlined">REKEY</Button>
          </Stack>
        </Box>
      </Box>
    </ThemeProvider>
  );
};
