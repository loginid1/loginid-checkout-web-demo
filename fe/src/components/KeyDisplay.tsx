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


    function copy(text:string){
		navigator.clipboard.writeText(text);
}
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
      >
        <Stack
          direction="row"
          alignItems="center"
        >
          <Typography
            variant="body1"
            textOverflow="ellipse"
            color={color}
            fontSize={12}
            noWrap
            maxWidth="70%"
          >
            {value}
          </Typography>
          <IconButton size="small" onClick={()=>copy(value)}>
            <ContentCopy />
          </IconButton>
        </Stack>
      </CardContent>
    </Card>
  );
};
