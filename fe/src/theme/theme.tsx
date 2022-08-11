import { createMuiTheme, createTheme } from "@mui/material/styles";
import { TypographyStyleOptions } from "@mui/material/styles/createTypography";
import { PaletteOptions as MuiPallete } from "@mui/material/styles/createPalette";
declare module "@mui/material/styles/createTypography" {
  export interface TypographyOptions {
    title?: TypographyStyleOptions | undefined;
    medium?: TypographyStyleOptions | undefined;
    mediumL?: TypographyStyleOptions | undefined;
  }
}

declare module "@mui/material/Typography" {
  interface TypographyPropsVariantOverrides {
    title: true;
    medium: true;
    mediumL: true;
  }
}

declare module "@mui/material/styles/createPalette" {
  export interface PaletteOptions {
    tertiary?: PaletteColorOptions | undefined;
    backgroundCard?: PaletteColorOptions | undefined;
  }
}


export const LoginID = createTheme({
  palette: {
    primary: {
      main: "#1642DF",
      contrastText: "#fff",
    },
    secondary: {
      main: "#1E2898",
    },
    tertiary: {
      main: "#E2F2FF",
    },
    background: {
      default: "#E2EAF9",
    },
    backgroundCard: {
      main: "#F2F2F2",
    },
  },
  typography: {
    // fontFamily: ["Roboto"].join(","),
    h1: {
      fontSize: "30px",
      lineHeight: "34px",
      fontWeight: "400",
    },
    h2: {
      fontSize: "24px",
      lineHeight: "24px",
      fontWeight: "500",
    },
    h3: {
      fontSize: "16px",
      lineHeight: "20px",
      fontWeight: "500",
    },
    body1: {
      fontSize: "16px",
      lineHeight: "20px",
      fontWeight: "400",
    },
    title: {
      color: "#2870FA",
      fontSize: "16px",
      fontWeight: "600",
    },
    medium: {
      color: "#2870FA",
      fontSize: "16px",
      fontWeight: "500",
    },
    mediumL: {
      color: "#fff",
      fontSize: "16px",
      lineHeight: "24px",
      letterSpacing: "1.2000000476837158px",
      fontWeight: "500",
    },
    subtitle1: {
      fontStyle: "medium",
      fontSize: "16px",
      lineHeight: "18px",
      letterSpacing: "0.15000000596046448px",
      fontWeight: "400",
    },
  },
});
