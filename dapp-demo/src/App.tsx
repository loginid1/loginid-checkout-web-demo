import React, { useEffect, useState } from "react";
import logo from "./logo.svg";
import "./App.css";
import { FidoVaultSDK, WalletTransaction } from "./lib/LoginidVaultSDK";
import algosdk, { SuggestedParams } from "algosdk";
import NFTImage from "./assets/Onboarding-3.png";
import VaultImage from "./assets/vault_logo_light.svg";
import ParseUtil from "./util/parse";
import {
	Alert,
	AlertColor,
	Box,
	Button,
	CssBaseline,
	Link,
	TextField,
	ThemeProvider,
	Container,
	Typography,
	Card,
	CardActions,
	CardMedia,
	CardHeader,
	CardContent,
	createTheme,
	Snackbar,
} from "@mui/material";
import { DispenserSDK } from "./lib/DispenserSDK";
import { DisplayMessage } from "./lib/common/message";

const theme = createTheme();
function App() {
	const [enableAccount, setEnableAccount] = useState<string>("");
	const [params, setParams] = useState<SuggestedParams>();
	const [displayMessage, setDisplayMessage] =
		useState<DisplayMessage | null>();
	useEffect(() => {
		setEnableAccount(localStorage.getItem("enable_account") || "");
		generateSuggestedParams();
	}, []);

	const wallet = new FidoVaultSDK(process.env.REACT_APP_VAULT_URL || "");
	async function handleEnableClick() {
		try {
			const result = await wallet.enable({ network: "sandnet" });
			if (result != null) {
				localStorage.setItem("enable_account", result.accounts[0]);
				setEnableAccount(result.accounts[0] || "");
				setDisplayMessage({
					text: "FIDO vault connected!",
					type: "info",
				});
			}
		} catch (error) {
			console.log(error);
			setDisplayMessage({
				text: (error as Error).message,
				type: "error",
			});
		}
	}
	async function handleDispenserClick() {
		try {
			let result = await DispenserSDK.dispense(enableAccount);
			//alert(" Your account now have " + result.amount + " micro Algos");
			setDisplayMessage({
				text: "you account now have " + result.amount + "micro Algos",
				type: "info",
			});
		} catch (error) {
			setDisplayMessage({
				text: (error as Error).message,
				type: "error",
			});
		}
	}

	async function generateSuggestedParams(): Promise<SuggestedParams> {
		const token =
			process.env.REACT_APP_ALGO_CLIENT_TOKEN ||
			"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
		const server =
			process.env.REACT_APP_ALGO_CLIENT_SERVER || "http://localhost";
		const port = process.env.REACT_APP_ALGO_CLIENT_PORT || 4001;
		const algodv2 = new algosdk.Algodv2(token, server, port);
		const suggestedParams = await algodv2.getTransactionParams().do();
		setParams(suggestedParams);
		return Promise.resolve(suggestedParams);
	}

	async function handleTransactionClick() {
		try {
			// construct a transaction note
			const note = new Uint8Array(Buffer.from("Hello World NFT", "utf8"));
			const addr = localStorage.getItem("enable_account");
			const receiver =
				process.env.REACT_APP_DAPP_ADDRESS ||
				"OZL4D23EET2S44UJBHZGHSMUQPJSA5YK7X4J737N5QZUJY3WE4X6PFHIXE";
			if (addr == null) {
				setDisplayMessage({
					text: "missing vault account!",
					type: "error",
				});
				return;
			}
			if (params == null) {
				setDisplayMessage({
					text: "need to prepare transaction!",
					type: "error",
				});
				return;
			}
			// create the transaction
			const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
				from: addr,
				to: receiver,
				amount: 10000,
				note,
				suggestedParams: params,
				// try adding another option to the list above by using TypeScript autocomplete (ctrl + space in VSCode)
			});
			let wTxn: WalletTransaction = {
				txn: Buffer.from(txn.toByte()).toString("base64"),
			};
			// Sign and post
			const res = await wallet.signAndPostTxns([wTxn]);
			console.log(res);
			setDisplayMessage({ text: "purchase complete!", type: "info" });
		} catch (error) {
			setDisplayMessage({
				text: (error as Error).message,
				type: "error",
			});
			console.log(error);
		}
	}
	const handleDisplayClose = (
		event?: React.SyntheticEvent | Event,
		reason?: string
	) => {
		if (reason === "clickaway") {
			return;
		}
		setDisplayMessage(null);
	};
	return (
		<ThemeProvider theme={theme}>
			<Container component="main" maxWidth="xs">
				{displayMessage && (
					<Snackbar
						open={displayMessage ? true : false}
						autoHideDuration={6000}
						onClose={handleDisplayClose}
						sx={{ width: "100%" }}
					>
						<Alert
							severity={
								(displayMessage?.type as AlertColor) || "info"
							}
							sx={{ width: "100%", minWidth: 300 }}
						>
							{displayMessage.text}
						</Alert>
					</Snackbar>
				)}
				<Card>
					<CardContent>
						<img src={VaultImage} height="32" />
					</CardContent>
					<CardContent>
						{enableAccount ? (
							<>
								<Typography>
									You have enable the following accounts:
								</Typography>
								<Typography>
									{ParseUtil.displayLongAddress(
										enableAccount
									)}
								</Typography>
							</>
						) : (
							<Typography>
								Connect to FIDO Vault account
							</Typography>
						)}
					</CardContent>
					<CardActions>
						<Button
							size="small"
							onClick={handleEnableClick}
							variant="outlined"
						>
							CONNECT
						</Button>
						<Button
							variant="outlined"
							size="small"
							href={wallet.baseURL + "/fe/register"}
							target="_blank"
							sx={{ ml: 2 }}
						>
							SIGNUP NEW ACCOUNT
						</Button>
					</CardActions>
				</Card>
				<Card sx={{ mt: 2 }}>
					<CardMedia
						component="img"
						height="194"
						image={NFTImage}
						alt="Paella dish"
					/>
					<CardContent>Purchase this NFT for 0.01 ALGO</CardContent>
					<CardActions>
						<Button size="small" onClick={generateSuggestedParams}>
							CHECKOUT
						</Button>
						<Button size="small" onClick={handleTransactionClick}>
							PURCHASE
						</Button>
					</CardActions>
				</Card>
				{enableAccount && (
					<Card sx={{ mt: 2 }}>
						<CardContent>
							<Typography variant="caption">
								Deposit 10 ALGO to:
							</Typography>
							<Typography>
								{ParseUtil.displayLongAddress(enableAccount)}
							</Typography>
						</CardContent>
						<CardActions>
							<Button size="small" onClick={handleDispenserClick}>
								DEPOSIT
							</Button>
						</CardActions>
					</Card>
				)}
			</Container>
		</ThemeProvider>
	);
}

export default App;
