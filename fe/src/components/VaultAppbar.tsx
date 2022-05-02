import {
  AppBar,
  Avatar,
  Box,
  Button,
  Container,
  IconButton,
  Menu,
  MenuItem,
  Paper,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";

const VaultAppBar: React.FC = ({}) => {
  return (
    <Box sx={{ flexGrow: 1 }}>
      <Paper
        elevation={0}
        sx={{
          p: 2,
          display: "flex",
          height: 40,
        }}
      ></Paper>
    </Box>
  );
};
export default VaultAppBar;
