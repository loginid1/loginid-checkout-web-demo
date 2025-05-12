import {
  createTheme,
  AppBar,
  Toolbar,
  Typography,
  Container,
  Button,
} from "@mui/material";
import CheckCircle from "@mui/icons-material/CheckCircle";
import { CallbackProps, ErrorProps } from "../types";
import Cancel from "@mui/icons-material/Cancel";
import { ThemeProvider } from "@emotion/react";

const theme = createTheme({
  palette: {
    primary: { main: "#30b0c7", contrastText: "#fff" },
    secondary: { main: "#3700b3", contrastText: "#fff" },
    success: { main: "#76FF03" },
  },
});

export const merchantConfigB = {
  name: "ZSports",
  theme,
};

export function CallbackB(props: CallbackProps) {
  return (
    <ThemeProvider theme={props.theme}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }} align="center">
            {props.name}
          </Typography>
        </Toolbar>
      </AppBar>
      <Container maxWidth="sm">
        <Typography variant="body1" sx={{ mt: 4 }}>
          Thank You For Your Purchase
        </Typography>
        <CheckCircle sx={{ fontSize: 128, m: 4 }} color="success" />
        <Typography variant="h6">Order #123RB23178Y Confirmed</Typography>
        <Typography variant="body2">
          Pay ${props.amount} through ABC Bank
        </Typography>
        <Button variant="contained" sx={{ mt: 4 }} fullWidth>
          Track Order
        </Button>
        <Button variant="text" fullWidth onClick={props.back}>
          Return To Shopping
        </Button>
      </Container>
    </ThemeProvider>
  );
}

export function ErrorB(props: ErrorProps) {
  return (
    <ThemeProvider theme={props.theme}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }} align="center">
            {props.name}
          </Typography>
        </Toolbar>
      </AppBar>
      <Container maxWidth="sm">
        <Typography variant="body1" sx={{ mt: 4 }}>
          Order Unsuccessful!
        </Typography>
        <Cancel sx={{ fontSize: 128, m: 4 }} color="error" />
        <Typography variant="body2"> ${props.error} </Typography>
        <Button variant="text" fullWidth onClick={props.back}>
          Return To Shopping
        </Button>
      </Container>
    </ThemeProvider>
  );
}
