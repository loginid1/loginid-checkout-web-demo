import {
  Box,
  Divider,
  Icon,
  Link,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
} from "@mui/material";
import { MenuIcon } from "../theme/icons";
import { LoginID } from "../theme/theme";

interface LoginidMenuItemProps {
  name: string;
  active: boolean;
  index: number;
  onClick: (index: number) => void;
}

export const MenuItem: React.FC<LoginidMenuItemProps> = ({
  name,
  active = false,
  index,
  ...props
}) => {
  const bgColor = active ? LoginID.palette.background.default : "#fff";
  return (
    <Box sx={{ backgroundColor: bgColor }}>
      <ListItemButton disableRipple onClick={() => props.onClick(index)}>
        <ListItemIcon>
          <MenuIcon name={name} isFocus={active} />
        </ListItemIcon>
        <ListItemText
          primary={
            <Typography variant="body1" color={active ? "primary" : "default"}>
              {name}
            </Typography>
          }
        />
        <Divider />
      </ListItemButton>
    </Box>
  );
};
