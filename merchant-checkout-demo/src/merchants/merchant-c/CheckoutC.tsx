import {
  ChangeLink,
  Container,
  Divide,
  Label,
  Section,
  Title,
  Value,
} from "./styles";
import { AppBar, Box, Button, Toolbar, Typography } from "@mui/material";
import { CheckoutProps } from "../types";

export function CheckoutC(props: CheckoutProps) {
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
        <Title variant="h6">Review and pay</Title>
        <Container>
          <Section>
            <Label>
              Contact <ChangeLink underline="hover">Change</ChangeLink>
            </Label>
            <Value>jordan.chen@domain.com</Value>
          </Section>

          <Divide />

          <Section>
            <Label>
              Ship to <ChangeLink underline="hover">Change</ChangeLink>
            </Label>
            <Value>Jordan Chen</Value>
            <Value>151 O'Connor Street</Value>
            <Value>Ottawa, ON, K2P 2L8</Value>
            <Value>Canada</Value>
          </Section>

          <Divide />

          <Section>
            <Label>
              Method <ChangeLink underline="hover">Change</ChangeLink>
            </Label>
            <Value>USPS . ${props.request.shipping}</Value>
            <Typography textAlign="left" variant="body2" color="text.secondary">
              1 other method available at $0.00
            </Typography>
          </Section>

          <Box textAlign="center" mt={4}>
            <Button
              variant="contained"
              sx={{
                backgroundColor: "#ca27ca",
                "&:hover": { backgroundColor: "#e85fe8" },
                borderRadius: 1,
                textTransform: "none",
                px: 4,
                py: 1.5,
                fontWeight: "bold",
                width: "100%",
              }}
              onClick={props.submit}
            >
              Pay with Wallet
            </Button>
          </Box>
        </Container>
      </Box>
    </>
  );
}
