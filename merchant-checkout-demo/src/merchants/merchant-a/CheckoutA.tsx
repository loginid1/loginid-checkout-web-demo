import {
  AppBar,
  Badge,
  Button,
  Container,
  createTheme,
  Divider,
  Stack,
  ThemeProvider,
  Toolbar,
  Typography,
} from "@mui/material";
import ShoppingCart from "@mui/icons-material/ShoppingCart";
import { CheckoutProps } from "../types";
import Grid from "@mui/material/Grid2";

export function CheckoutA(props: CheckoutProps) {
  const theme = createTheme({
    palette: {
      primary: {
        main: "#003BD1",
        contrastText: "#fff",
      },
      secondary: {
        main: "#FFF176",
      },
    },
  });

  return (
    <>
      <ThemeProvider theme={theme}>
        <AppBar position="static">
          <Toolbar>
            <Typography
              variant="h6"
              component="div"
              sx={{ flexGrow: 1 }}
              align="left"
            >
              {props.request.merchant}
            </Typography>
            <Badge badgeContent={1} color="secondary">
              <ShoppingCart />
            </Badge>
          </Toolbar>
        </AppBar>
        <Container maxWidth="sm">
          <Typography variant="h6" component="h6" align="left" sx={{ mt: 4 }}>
            Order Summary
          </Typography>
          <Divider />
          <Grid
            container
            rowSpacing={1}
            columnSpacing={{ xs: 1, sm: 2, md: 3 }}
            sx={{ m: 2 }}
          >
            <Grid size={2}>
              <img
                src="/items/running-shoe.jpg"
                width="64"
                height="64"
                alt="Running Shoes"
              />
            </Grid>
            <Grid
              size={8}
              display="flex"
              justifyContent="start"
              alignItems="center"
            >
              <Stack>
                <Typography variant="body1">Running shoes</Typography>
                <Typography variant="caption" align="left">
                  $120.33 x 1
                </Typography>
              </Stack>
            </Grid>
            <Grid
              size={2}
              display="flex"
              justifyContent="end"
              alignItems="end"
              justifyItems="end"
            >
              <Typography variant="subtitle2">$120.33</Typography>
            </Grid>
          </Grid>
          <Grid
            container
            rowSpacing={1}
            columnSpacing={{ xs: 1, sm: 2, md: 3 }}
            sx={{ m: 2, mt: 4 }}
          >
            <Grid
              size={10}
              display="flex"
              justifyContent="start"
              alignItems="center"
            >
              <Typography variant="caption">Subtotal</Typography>
            </Grid>
            <Grid
              size={2}
              display="flex"
              justifyContent="end"
              alignItems="end"
              justifyItems="end"
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 500 }}>
                ${props.request.subtotal}
              </Typography>
            </Grid>
            <Grid
              size={10}
              display="flex"
              justifyContent="start"
              alignItems="center"
            >
              <Typography variant="caption">Tax</Typography>
            </Grid>
            <Grid
              size={2}
              display="flex"
              justifyContent="end"
              alignItems="end"
              justifyItems="end"
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 500 }}>
                ${props.request.tax}
              </Typography>
            </Grid>
            <Grid
              size={10}
              display="flex"
              justifyContent="start"
              alignItems="center"
            >
              <Typography variant="caption">Shipping Fee</Typography>
            </Grid>
            <Grid
              size={2}
              display="flex"
              justifyContent="end"
              alignItems="end"
              justifyItems="end"
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 500 }}>
                ${props.request.shipping}
              </Typography>
            </Grid>
            <Grid
              size={10}
              display="flex"
              justifyContent="start"
              alignItems="center"
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Total
              </Typography>
            </Grid>
            <Grid
              size={2}
              display="flex"
              justifyContent="end"
              alignItems="end"
              justifyItems="end"
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                ${props.request.total}
              </Typography>
            </Grid>
          </Grid>
          <Button
            variant="outlined"
            sx={{ textTransform: "none" }}
            fullWidth
            onClick={props.submit}
          >
            Pay with ABC Bank
          </Button>
        </Container>
      </ThemeProvider>
    </>
  );
}
