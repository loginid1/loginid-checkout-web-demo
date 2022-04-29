import { createMuiTheme, createTheme } from "@mui/material/styles";
import { TypographyStyleOptions } from "@mui/material/styles/createTypography";
import { PaletteOptions as MuiPallete } from "@mui/material/styles/createPalette";
declare module "@mui/material/styles/createTypography" {
  export interface TypographyOptions {
    medium?: TypographyStyleOptions | undefined
    mediumL?: TypographyStyleOptions | undefined
  }
}

declare module '@mui/material/Typography' {
  interface TypographyPropsVariantOverrides {
    medium: true;
    mediumL: true
  }
}

declare module "@mui/material/styles/createPalette" {
  export interface PaletteOptions {
    tertiary?: PaletteColorOptions | undefined
  }
}


export const LoginID = createTheme({
  palette: {
    primary: {
      main: "#2870FA",
      dark: "#1E2898",
      contrastText: "#fff"
    },
    secondary: {
      main: "#235FD0",
    },
    tertiary: {
      main: "#1E2898",
    },
    background: {
      default: "#E2EAF9",
    },
  },
  typography: {
    fontFamily: ["Roboto"].join(","),
    h1: {
      fontStyle: "normal",
      fontSize: "28px",
      lineHeight: "34px",
    },
    h2: {
      fontStyle: "medium",
      fontSize: "22px",
      lineHeight: "24px",
    },
    h3: {
      fontStyle: "regular",
      fontSize: "14px",
      lineHeight: "20px",
    },
    body1: {
      fontStyle: "regular",
      fontSize: "14px",
      lineHeight: "20px",
    },
    medium: {
      color: "#2870FA",
      fontstyle: "Medium",
      fontSize: "14px",
      lineHeight: "24px",
      letterSpacing: "1.2000000476837158px"
    },
    mediumL: {
      color: "#fff",
      fontstyle: "Medium",
      fontSize: "14px",
      lineHeight: "24px",
      letterSpacing: "1.2000000476837158px"
    },
    subtitle1: {
      fontStyle: "medium",
      fontSize: "14px",
      lineHeight: "16px",
      letterSpacing: "0.15000000596046448px",
    },
  },
  // spacing: {}
});
