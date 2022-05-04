import { Box, CssBaseline, Grid, Stack, ThemeProvider } from "@mui/material";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import vaultSDK from "../lib/VaultSDK";
import { Profile } from "../lib/VaultSDK/vault/user";
import { AuthService } from "../services/auth";
import { LoginID } from "../theme/theme";
import { Menu } from "./Menu";
import VaultAppBar from "./VaultAppbar";

interface VaultBaseInterface {
  focus: number;
}

export const VaultBase: React.FC<VaultBaseInterface> = ({
  focus,
  ...props
}) => {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);

  const mobileMenuHandler = () => {
    setMobileOpen(!mobileOpen);
  };

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
        "/login?redisrect_error=" +
          encodeURIComponent("not authorized - please login again")
      );
    }
  }

  return (
    <ThemeProvider theme={LoginID}>
      <Stack
        spacing={{ xs: 2, md: 4 }}
        direction="row"
        sx={{
          display: "flex",
          mr: { xs: 2, md: 4 },
          my: 2,
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
