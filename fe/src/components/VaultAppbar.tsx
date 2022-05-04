import { Menu } from "@mui/icons-material";
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Container,
  Divider,
  IconButton,
  Link,
  MenuItem,
  Paper,
  Stack,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { Profile } from "../lib/VaultSDK/vault/user";
import { AuthService } from "../services/auth";

interface AppBarInterface {
  backUrl?: string;
  mobileMenuHandler?: () => void;
}

const VaultAppBar: React.FC<AppBarInterface> = ({ backUrl, mobileMenuHandler }) => {
  const navigate = useNavigate();

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
          <Box>
            <IconButton
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
          </Box>
          <Stack direction="row" spacing={2}>
            <Divider variant="middle" />
            <Button
              sx={{
                textTransform: "none",
                "&:hover": { backgroundColor: "transparent" },
              }}
              onClick={handleLogout}
            >
              log out
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Box>
  );
};
export default VaultAppBar;
