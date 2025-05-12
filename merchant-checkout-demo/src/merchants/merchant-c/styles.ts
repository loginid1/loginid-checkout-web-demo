import { Box, Divider, Link, Typography } from "@mui/material";
import { styled } from "@mui/system";

export const Container = styled(Box)(({ theme }) => ({
  //maxWidth: 480,
  margin: "auto",
  padding: theme.spacing(2),
  backgroundColor: "#fff",
  borderRadius: theme.spacing(1),
  //boxShadow: theme.shadows[1],
  //  padding: theme.spacing(2),
  width: "100%",
  [theme.breakpoints.up("sm")]: {
    width: 540,
  },
  [theme.breakpoints.up("md")]: {
    width: 720,
  },
}));

export const Title = styled(Typography)(({ theme }) => ({
  width: "100%",
  [theme.breakpoints.up("sm")]: {
    width: 540,
  },
  [theme.breakpoints.up("md")]: {
    width: 720,
  },
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
