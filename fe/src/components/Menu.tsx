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
import React from "react";
import { LoginID } from "../theme/theme";
import { MenuItem } from "./MenuItem";
import menuHeader from "../assets/sidemenu/MenuHeader.png";
import { ReactComponent as VaultLogo } from "../assets/logoContrast.svg";
import LoginIDLogo from "../assets/sidemenu/LoginIDLogo.svg";
import { useNavigate } from "react-router-dom";

const drawerWidth = 246;

const menuItems = [
  "Credential",
  "Algorand",
  "Dapps",
  "DIDs",
  "Profile",
  "Settings",
];
export const Menu: React.FC = () => {
  const navigate = useNavigate();
  const [activeMenu, setActiveMenu] = React.useState(0);

  const clickMenu = (index: number) => {
    setActiveMenu(index);
    navigate("/"+menuItems[index]);
  };

  const menuList = menuItems.map((item, index) => {
    return (
      <MenuItem
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
        open
        sx={{
          width: `${drawerWidth}px`,
          minHeight: "100vh",
          flexShrink: 1,
          "& .MuiDrawer-paper": {
            width: drawerWidth,
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
            display:"flex",
            flexDirection:"column",
            backgroundColor: "white",
          }}
        >
          <List component="nav">{menuList}</List>

          
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
              powered by&nbsp;<img src={LoginIDLogo} alt="something" />
            </Typography>
          </Stack>
        </Box>
      </Drawer>
    </ThemeProvider>
  );
};
