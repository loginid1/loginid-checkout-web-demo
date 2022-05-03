import { ThemeProvider } from "@emotion/react";
import {
  Box,
  Divider,
  Drawer,
  Link,
  List,
  Stack,
  SvgIcon,
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
  "Credential",
  "Algorand",
  "Dapps",
  "DIDs",
  "Profile",
  "Settings",
];

const navigateMenu = [
  "/home",
  "/algorand_accounts",
  "",
  "",
  "",
  "",
];

interface MenuInterface {
  focus: number;
}

export const Menu: React.FC<MenuInterface> = ({ focus }) => {
  const navigate = useNavigate();
  const [activeMenu, setActiveMenu] = React.useState(0);

  useEffect(() => {
    setActiveMenu(focus);
  }, []);

  const clickMenu = (index: number) => {
    navigate(navigateMenu[index]);
  };

  const drawerWidth = 246;

  const menuList = menuItems.map((item, index) => {
    return (
      <MenuItem
        key={item}
        name={item}
        index={index}
        active={activeMenu === index}
        onClick={clickMenu}
      />
    );
  });

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
        }}
      >
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
        <Divider />
        <Box
          sx={{
            borderRadius: "2%",
            mt: "-10px",
            height: "100vh",
            display: "flex",
            flexDirection: "column",
            backgroundColor: "white",
          }}
        >
          <List>{menuList}</List>

          <Stack spacing={2} sx={{ mt: "auto", mb: 2 }}>
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
        </Box>
      </Drawer>
    </ThemeProvider>
  );
};
