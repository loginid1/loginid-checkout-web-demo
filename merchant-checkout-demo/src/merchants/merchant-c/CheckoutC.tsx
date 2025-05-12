import {
  ChangeLink,
  Container,
  Divide,
  Label,
  Section,
  Title,
  Value,
  WalletButton,
} from "./styles";
import { AppBar, Box, Toolbar, Typography } from "@mui/material";
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

          <Divide />

          <Section>
            <Label>Items</Label>
            {[
              {
                name: "Snake plant",
                description: "Concrete pot",
                price: 59,
                image: "/snake-plant.png",
              },
              {
                name: "Watering can",
                description: "Matte black",
                price: 39,
                image: "/watering-can.png",
              },
            ].map((item, index) => (
              <Box key={index} display="flex" alignItems="center" mb={2}>
                <Box
                  component="img"
                  src={item.image}
                  alt={item.name}
                  sx={{
                    width: 64,
                    height: 64,
                    mr: 2,
                    backgroundColor: "#f0f0f0",
                  }}
                />
                <Box textAlign="left" flexGrow={1}>
                  <Typography fontWeight="bold">{item.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {item.description}
                  </Typography>
                </Box>
                <Typography fontWeight="bold">
                  ${item.price.toFixed(2)}
                </Typography>
              </Box>
            ))}
          </Section>

          <Divide />

          <Section>
            <Box display="flex" justifyContent="space-between" mb={1}>
              <Typography>Subtotal</Typography>
              <Typography>${props.request.subtotal}</Typography>
            </Box>
            <Box display="flex" justifyContent="space-between" mb={1}>
              <Typography>Shipping</Typography>
              <Typography>${props.request.shipping}</Typography>
            </Box>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              mb={1}
            >
              <Typography>Estimated taxes</Typography>
              <Typography>{props.request.tax}</Typography>
            </Box>
            <Box display="flex" justifyContent="space-between" mt={2}>
              <Typography fontWeight="bold">Total</Typography>
              <Typography fontWeight="bold">${props.request.total}</Typography>
            </Box>
          </Section>

          <Box textAlign="center" mt={4}>
            <WalletButton variant="contained" onClick={props.submit}>
              Pay with Wallet
            </WalletButton>
          </Box>
        </Container>
      </Box>
    </>
  );
}
