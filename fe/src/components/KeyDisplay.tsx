import {
  alpha,
  Card,
  CardContent,
  IconButton,
  Palette,
  Typography,
} from "@mui/material";
import { ContentCopy } from "@mui/icons-material";

type keyDisplayProps = {
  value: string;
  onClick?: () => void;
  color?:
    | "primary"
    | "secondary"
    | "error"
    | "info"
    | "success"
    | "warning"
    | undefined;
};

export const KeyDisplay: React.FC<keyDisplayProps> = ({
  value,
  color = "",
  onClick,
}) => {
  return (
    <Card
      variant="outlined"
      sx={{ width: "100%", backgroundColor: alpha("#F2F2F2", 0.2) }}
      elevation={0}
    >
      <CardContent
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <Typography
          noWrap
          variant="body1"
          overflow="hidden"
          textOverflow="ellipsis"
          color={color}
        >
          {value}
          <IconButton size="small" onClick={onClick}>
            <ContentCopy />
          </IconButton>
        </Typography>
      </CardContent>
    </Card>
  );
};
