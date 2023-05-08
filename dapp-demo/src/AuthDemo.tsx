import { WalletSDK } from "@loginid/wallet-sdk";
import { createTheme,  responsiveFontSizes,  ThemeProvider } from "@mui/material";
import React, { useEffect, useState } from "react";

import { Routes, Route, Link, Navigate } from "react-router-dom";
import "./AuthDemo.css";
import Pricing from "./Pricing";
import { demo_theme } from "./theme/theme";
import typography from "./theme/typography";

let theme = createTheme({
	palette: {
		primary: {
		  light: '#63ccff',
		  main: '#009be5',
		  dark: '#006db3',
		},
	  },
		typography,
	  shape: {
		borderRadius: 8,
	  },
	  components: {
		MuiTab: {
		  defaultProps: {
			disableRipple: true,
		  },
		},
	  },
	  mixins: {
		toolbar: {
		  minHeight: 48,
		},
	  },
	});

theme= responsiveFontSizes(theme);

	const wallet = new WalletSDK(process.env.REACT_APP_VAULT_URL || "", process.env.REACT_APP_WALLET_API);
export function AuthDemo() {
	useEffect(() => {
		//wallet.signup();
	});

	return (
		<ThemeProvider theme={demo_theme}>
			<Pricing />
		</ThemeProvider>
	);
}
