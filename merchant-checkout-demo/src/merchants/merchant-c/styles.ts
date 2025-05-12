import { Box, Button, Divider, Link, Typography } from "@mui/material";
import { styled } from "@mui/system";

export const Container = styled(Box)(({ theme }) => ({
  margin: "auto",
  padding: theme.spacing(2),
  backgroundColor: "#fff",
  borderRadius: theme.spacing(1),
  width: "100%",
  [theme.breakpoints.up("sm")]: {
    width: 540,
  },
  /*
  [theme.breakpoints.up("md")]: {
    width: 720,
  },
  */
}));

export const Title = styled(Typography)(({ theme }) => ({
  width: "100%",
  [theme.breakpoints.up("sm")]: {
    width: 540,
  },
  /*
  [theme.breakpoints.up("md")]: {
    width: 720,
  },
  */
  marginBottom: theme.spacing(2),
  marginLeft: "auto",
  marginRight: "auto",
  textAlign: "left",
}));

export const Section = styled(Box)(() => ({}));

export const Label = styled(Typography)(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  fontSize: 14,
  color: "#707070",
  marginBottom: theme.spacing(0.5),
}));

export const Value = styled(Typography)(() => ({
  textAlign: "left",
  fontSize: 16,
}));

export const ChangeLink = styled(Link)(() => ({
  fontSize: 14,
  float: "right",
  cursor: "pointer",
}));

export const Divide = styled(Divider)(({ theme }) => ({
  margin: theme.spacing(2, 0),
}));

export const WalletButton = styled(Button)(({ theme }) => ({
  backgroundColor: "#ca27ca",
  "&:hover": {
    backgroundColor: "#e85fe8",
  },
  borderRadius: theme.shape.borderRadius,
  textTransform: "none",
  paddingLeft: theme.spacing(4),
  paddingRight: theme.spacing(4),
  paddingTop: theme.spacing(1.5),
  paddingBottom: theme.spacing(1.5),
  fontWeight: "bold",
  width: "100%",
}));

export const MerchantButton = styled(Button)(({ theme }) => ({
  backgroundColor: "#1773B0",
  "&:hover": {
    backgroundColor: "#2e8bd0",
  },
  borderRadius: theme.shape.borderRadius,
  textTransform: "none",
  paddingLeft: theme.spacing(4),
  paddingRight: theme.spacing(4),
  paddingTop: theme.spacing(1.5),
  paddingBottom: theme.spacing(1.5),
  fontWeight: "bold",
  width: "100%",
}));

export const ReviewHeader = styled(Box)(({ theme }) => ({
  display: "flex",
  marginLeft: "auto",
  marginRight: "auto",
  marginBottom: theme.spacing(3),
  textAlign: "left",
  width: "100%",
  [theme.breakpoints.up("sm")]: {
    width: 540,
  },
}));

export const ReviewMain = styled(Box)(({ theme }) => ({
  marginLeft: "auto",
  marginRight: "auto",
  padding: theme.spacing(2),
  borderRadius: theme.spacing(1),
  textAlign: "left",
  width: "100%",
  backgroundColor: "#fff",
  [theme.breakpoints.up("sm")]: {
    width: 540,
  },
}));

export const ReviewLabel = styled(Typography)(() => ({
  fontSize: 14,
  color: "#707070",
}));
