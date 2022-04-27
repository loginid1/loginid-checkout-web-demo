import { createTheme } from "@mui/material/styles";

export const LoginID = createTheme({
  palette: {
    primary: {
      main: "#2870FA",
    },
    secondary: {
      main: "#235FD0",
    },
  },
  typography: {
    fontFamily: [
      "Roboto",
      "Helvetica Neue"
    ].join(","),
    h1: {
      fontStyle: "regular",
      fontSize: "28px",
      lineHeight: "34px"
    },
    h2: {
      fontStyle: "medium",
      fontSize: "22px",
      lineHeight: "24px"
    },
    h3: {
      fontStyle: "regular",
      fontSize: "14px",
      lineHeight: "20px"
    },
    body1: {
      fontStyle: "regular",
      fontSize: "14px",
      lineHeight: "20px"
    },
    // medium: {
      // fontstyle: "Medium"
    // }
    subtitle1: {
      fontStyle: "medium",
      fontSize: "14px",
      lineHeight: "16px",
      letterSpacing: "0.15000000596046448px"
    }
  },
  // spacing: {}
});
