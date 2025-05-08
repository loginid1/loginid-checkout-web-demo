/*
 *   Copyright (c) 2025 LoginID Inc
 *   All rights reserved.

 *   Licensed under the Apache License, Version 2.0 (the "License");
 *   you may not use this file except in compliance with the License.
 *   You may obtain a copy of the License at

 *   http://www.apache.org/licenses/LICENSE-2.0

 *   Unless required by applicable law or agreed to in writing, software
 *   distributed under the License is distributed on an "AS IS" BASIS,
 *   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *   See the License for the specific language governing permissions and
 *   limitations under the License.
 */

import {
  createTheme,
  AppBar,
  Toolbar,
  Typography,
  Container,
  Button,
  Theme,
} from "@mui/material";
import CheckCircle from "@mui/icons-material/CheckCircle";
import { useSearchParams } from "react-router-dom";
import Cancel from "@mui/icons-material/Cancel";
import { CheckoutResult } from "./lib/checkout";
import { ThemeProvider } from "@emotion/react";
import { useEffect, useState } from "react";
import { CID } from "./lib/crypto";

export interface CallbackProps {
  name: string;
  amount: string;
  theme: Theme;
  back: () => void;
}

export interface ErrorProps {
  name: string;
  error: string;
  theme: Theme;
  back: () => void;
}

const merchantTemplate = process.env.REACT_APP_MERCHANT || "b";

const themeA = createTheme({
  palette: {
    primary: {
      main: "#003BD1",
      contrastText: "#fff",
    },
    secondary: {
      main: "#FFF176",
    },

    success: {
      main: "#76FF03",
    },
  },
});

const themeB = createTheme({
  palette: {
    primary: {
      main: "#30b0c7",
      contrastText: "#fff",
    },
    secondary: {
      main: "#3700b3",
      contrastText: "#fff",
    },
    success: {
      main: "#76FF03",
    },
  },
});

const config = {
  theme: merchantTemplate === "a" ? themeA : themeB,
  name: merchantTemplate === "a" ? "EStore" : "ZSports",
};

export function CallbackPage() {
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const queryData = searchParams.get("data");
    if (queryData) {
      const base64 = atob(queryData);
      const resp: CheckoutResult = JSON.parse(base64);

      if (resp.error) {
        setError(resp.error);
      }

      // only mark checkout ID as valid if the response is successful
      if (resp.passkey) {
        CID.setCIDValid();
      }
    }
  }, [searchParams]);

  function handleBack() {
    window.document.location.href = "/";
  }

  function RenderView() {
    if (error !== "") {
      return (
        <Error
          name={config.name}
          error={error}
          theme={config.theme}
          back={handleBack}
        />
      );
    } else {
      return (
        <Callback
          name={config.name}
          amount="127.57"
          theme={config.theme}
          back={handleBack}
        />
      );
    }
  }

  return (
    <>
      <RenderView />
    </>
  );
}

function Callback(props: CallbackProps) {
  return (
    <>
      <ThemeProvider theme={props.theme}>
        <AppBar position="static">
          <Toolbar>
            <Typography
              variant="h6"
              component="div"
              sx={{ flexGrow: 1 }}
              align="center"
            >
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
          <Button
            variant="contained"
            sx={{ mt: 4, textTransform: "none" }}
            fullWidth
          >
            Track Order
          </Button>
          <Button
            variant="text"
            sx={{ textTransform: "none" }}
            fullWidth
            onClick={props.back}
          >
            Return To Shopping
          </Button>
        </Container>
      </ThemeProvider>
    </>
  );
}

function Error(props: ErrorProps) {
  return (
    <>
      <ThemeProvider theme={props.theme}>
        <AppBar position="static">
          <Toolbar>
            <Typography
              variant="h6"
              component="div"
              sx={{ flexGrow: 1 }}
              align="center"
            >
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
          <Button
            variant="text"
            sx={{ textTransform: "none" }}
            fullWidth
            onClick={props.back}
          >
            Return To Shopping
          </Button>
        </Container>
      </ThemeProvider>
    </>
  );
}
