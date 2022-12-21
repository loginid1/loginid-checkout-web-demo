import { ThemeProvider } from "@emotion/react";
import {
  Box,
  Drawer,
  Link,
  List,
  Stack,
  Toolbar,
  Typography,
} from "@mui/material";
import React, { useEffect } from "react";
import { LoginID } from "../theme/theme";
import { MenuItem } from "./MenuItem";
import menuHeader from "../assets/sidemenu/MenuHeader.png";
import { ReactComponent as VaultLogo } from "../assets/logoContrast.svg";
import LoginIDLogo from "../assets/sidemenu/LoginIDLogo.svg";
import { useNavigate } from "react-router-dom";

const menuItems = [
  "My Credential",
  "Algorand",
  "Dapps",
  "DIDs",
];

const navigateMenu = ["/credential", "/algorand_accounts", "/dapp_connections", "/did"];

interface MenuInterface {
  focus: number;
  mobileOpen?: boolean;
  mobileMenuHandler?: () => void;
}

export const Menu: React.FC<MenuInterface> = ({
  focus,
  mobileOpen = false,
  mobileMenuHandler,
}) => {
  const navigate = useNavigate();
  const [activeMenu, setActiveMenu] = React.useState(0);
  // const [mobileOpen, setMobileOpen] = React.useState(false);

  useEffect(() => {
    setActiveMenu(focus);
  }, []);

  const clickMenu = (index: number) => {
    navigate(navigateMenu[index]);
  };

  const drawerWidth = 300;

  const menuList = menuItems.map((item, index) => {
    return (
      <MenuItem
        key={index}
        name={item}
        index={index}
        active={activeMenu === index}
        onClick={clickMenu}
      />
    );
  });

  const drawer = (
    <Stack
      sx={{
        height: "100%",
        justifyContent: "space-between",
      }}
    >
      <Box>
        <Toolbar
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundImage: `url(${menuHeader})`,
            backgroundSize: "cover",
            zIndex: "-1",
          }}
        >
          {/* Hard Coded */}
          <Box sx={{ mt: "34px", mb: "34px" }}>
            <VaultLogo />
          </Box>
        </Toolbar>

        <Box
          sx={{
            borderRadius: "2%",
            mt: "-10px",
            backgroundColor: "white",
          }}
        >
          <List>{menuList}</List>
        </Box>
      </Box>
      <Stack
        spacing={2}
        sx={{
          alignItems: "center",
          justifyContent: "center",
          pb: 4,
        }}
      >
        <Link href="#" color="#615E5E" sx={{ textDecoration: "none" }}>
          <Typography variant="body1">Contact Us</Typography>
        </Link>
        <Link href="#" color="#615E5E" sx={{ textDecoration: "none" }}>
          <Typography variant="body1">Learn more about FIDO</Typography>
        </Link>
        <Typography
          variant="body1"
          color="#1E2898"
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          powered by&nbsp;
          <img src={LoginIDLogo} alt="something" />
        </Typography>
      </Stack>
    </Stack>
  );

  return (
    <ThemeProvider theme={LoginID}>
      <Drawer
        variant="permanent"
        anchor="left"
        sx={{
          width: `${drawerWidth}px`,
          minHeight: "100vh",
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: `${drawerWidth}px`,
          },
          display: { xs: "none", sm: "inherit" },
        }}
      >
        {drawer}
      </Drawer>
      <Drawer
        variant="temporary"
        anchor="left"
        open={mobileOpen}
        onClose={mobileMenuHandler}
        sx={{
          width: "60%",
          minHeight: "100vh",
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: "60%",
          },
          display: { xs: "inherit", sm: "none" },
        }}
      >
        {drawer}
      </Drawer>
    </ThemeProvider>
  );
};
