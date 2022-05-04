import { Box, CssBaseline, Grid, Stack, ThemeProvider } from "@mui/material";
import { useState } from "react";
import { LoginID } from "../theme/theme";
import { Menu } from "./Menu";
import VaultAppBar from "./VaultAppbar";

interface VaultBaseInterface {
  focus: number
}

export const VaultBase: React.FC<VaultBaseInterface> = ({focus, ...props}) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const mobileMenuHandler = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <ThemeProvider theme={LoginID}>
      <Stack
        spacing={4}
        direction="row"
        sx={{
          display: "flex",
          mr: 4,
          my: 2
        }}
      >
        <CssBaseline />
        <Menu
          focus={focus}
          mobileOpen={mobileOpen}
          mobileMenuHandler={mobileMenuHandler}
        />
        <Stack
          spacing={2}
          sx={{
            width: "100%",
          }}
        >
          <VaultAppBar mobileMenuHandler={mobileMenuHandler} />
          {props.children}
        </Stack>
      </Stack>
    </ThemeProvider>
  );
};
