import { ArrowDropDown, Menu } from "@mui/icons-material";
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Container,
  Divider,
  IconButton,
  Link,
  Menu as Drop,
  MenuItem,
  Paper,
  Stack,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Profile } from "../lib/VaultSDK/vault/user";
import { AuthService } from "../services/auth";

interface AppBarInterface {
  backUrl?: string;
  mobileMenuHandler?: () => void;
}

const VaultAppBar: React.FC<AppBarInterface> = ({
  backUrl,
  mobileMenuHandler,
}) => {
  const navigate = useNavigate();

  const [username, setUsername] = useState(AuthService.getUsername());
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  function handleLogout(e: React.MouseEvent) {
    AuthService.logout();
    navigate("/login");
  }

  return (
    <Box>
      <Paper
        elevation={0}
        sx={{
          p: 2,
          display: "flex",
          height: 40,
        }}
      >
        <Stack
          spacing={2}
          direction="row"
          sx={{
            width: "100%",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Stack direction="row" spacing={2} alignItems="center">
            <IconButton
              color="primary"
              onClick={mobileMenuHandler}
              sx={{ display: { xs: "inherit", sm: "none" } }}
            >
              <Menu />
            </IconButton>

            {backUrl && (
              <Button
                sx={{
                  textTransform: "none",
                  "&:hover": { backgroundColor: "transparent" },
                }}
                onClick={() => navigate(backUrl)}
              >
                {"<"} back
              </Button>
            )}
          </Stack>
          <Stack direction="row" spacing={2} alignItems="center">
            <Divider orientation="vertical" />
            <Button
              sx={{
                textTransform: "none",
                "&:hover": { backgroundColor: "transparent" },
              }}
              aria-controls={open ? "basic-menu" : undefined}
              aria-haspopup="true"
              aria-expanded={open ? "true" : undefined}
              onClick={handleClick}
            >
              {username}
              <ArrowDropDown />
            </Button>
          </Stack>
        </Stack>
        <Drop
          id="basic-menu"
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
        >
          <MenuItem onClick={handleLogout}>Logout</MenuItem>
        </Drop>
      </Paper>
    </Box>
  );
};
export default VaultAppBar;
