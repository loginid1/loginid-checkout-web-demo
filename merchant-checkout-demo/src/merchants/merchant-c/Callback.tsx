import {
  createTheme,
  AppBar,
  Toolbar,
  Typography,
  Container,
  Button,
  Box,
} from "@mui/material";
import {
  MerchantButton,
  ReviewHeader,
  ReviewLabel,
  ReviewMain,
} from "./styles";
import { CallbackProps, ErrorProps } from "../types";
import Cancel from "@mui/icons-material/Cancel";
import { ThemeProvider } from "@emotion/react";

const theme = createTheme({});

export const merchantConfigA = {
  name: "EStore",
  theme,
};

export function CallbackC(props: CallbackProps) {
  return (
    <>
      <AppBar position="static" sx={{ backgroundColor: "#fff" }}>
        <Toolbar>
          <img
            src="/plants-logo.png"
            alt="Plants Logo"
            style={{ height: 40 }}
          />
        </Toolbar>
      </AppBar>
      <Box
        sx={{ backgroundColor: "#f8f8f8", minHeight: "100vh", py: 4, px: 2 }}
      >
        <ReviewHeader>
          <img
            src="/checkmark-circle.svg"
            alt="Checkmark"
            style={{ height: 50, marginRight: "1rem" }}
          />
          <Box>
            <Typography variant="body2" color="text.secondary">
              Confirmation #DQFDHG5E0
            </Typography>
            <Typography variant="h6" fontWeight="bold">
              Thank you, Jordan!
            </Typography>
          </Box>
        </ReviewHeader>

        <ReviewMain>
          <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
            Order details
          </Typography>

          <Box sx={{ mb: 2 }}>
            <ReviewLabel variant="caption">Contact information</ReviewLabel>
            <Typography>jordan.chen@domain.com</Typography>
          </Box>

          <Box sx={{ mb: 2 }}>
            <ReviewLabel variant="caption">Shipping address</ReviewLabel>
            <Typography>Jordan Chen</Typography>
            <Typography>151 O'Connor St</Typography>
            <Typography>Ottawa, ON, K2P 2L8</Typography>
            <Typography>Canada</Typography>
          </Box>

          <Box sx={{ mb: 2 }}>
            <ReviewLabel variant="caption">Shipping method</ReviewLabel>
            <Typography>USPS</Typography>
          </Box>

          <Box sx={{ mb: 2 }}>
            <ReviewLabel variant="caption">Payment method</ReviewLabel>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <img
                src="/pay-icon.png"
                alt="Visa"
                width={40}
                style={{ marginRight: 8, marginTop: 4 }}
              />
              <Typography>Visa •••• 4242 – ${props.amount}</Typography>
            </Box>
          </Box>

          <Box>
            <ReviewLabel variant="caption">Billing address</ReviewLabel>
            <Typography>Jordan Chen</Typography>
            <Typography>151 O'Connor St</Typography>
            <Typography>Ottawa, ON, K2P 2L8</Typography>
            <Typography>Canada</Typography>
          </Box>

          <Box textAlign="center" mt={4}>
            <MerchantButton variant="contained" onClick={props.back}>
              Continue Shopping
            </MerchantButton>
          </Box>
        </ReviewMain>
      </Box>
    </>
  );
}

export function ErrorC(props: ErrorProps) {
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
