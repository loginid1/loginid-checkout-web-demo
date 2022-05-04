import {
  alpha,
  Card,
  CardContent,
  IconButton,
  Palette,
  Stack,
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
      sx={{
        display: "flex",
        maxWidth: "100%",
        backgroundColor: alpha("#F2F2F2", 0.2),
      }}
      elevation={0}
    >
      <CardContent
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <Stack spacing={2} direction="row" justifyContent="center" alignItems="center">
          <Typography
            maxWidth="50vw"
            noWrap
            variant="body1"
            textOverflow="ellipsis"
            color={color}
          >
            {value}
          </Typography>
          <IconButton size="small" onClick={onClick}>
            <ContentCopy />
          </IconButton>
        </Stack>
      </CardContent>
    </Card>
  );
};
