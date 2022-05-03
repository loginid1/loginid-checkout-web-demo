import React, { useEffect, useState } from "react";
import logo from "./logo.svg";
import "./App.css";
import { FidoVaultSDK, WalletTransaction } from "./lib/LoginidVaultSDK";
import algosdk from "algosdk";
import NFTImage from "./assets/Onboarding-3.png";
import VaultImage from "./assets/vault_logo_light.svg";
import ParseUtil from "./util/parse";
import {
	Alert,
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
} from "@mui/material";
import { DispenserSDK } from "./lib/DispenserSDK";

const theme = createTheme();
function App() {
	const [enableAccount,setEnableAccount] = useState<string>("");
	useEffect(() => {
		setEnableAccount(localStorage.getItem("enable_account")||"");
	}, []);


	const wallet = new FidoVaultSDK(process.env.REACT_APP_VAULT_URL || "");
	async function handleEnableClick() {
		try {
			const result = await wallet.enable({ network: "sandnet" });
			if (result != null) {
				localStorage.setItem("enable_account", result.accounts[0]);
				setEnableAccount(result.accounts[0]||"");
			}
		} catch (e) {
			console.log(e);
		}
	}
	async function handleDispenserClick(){
		try {
			let result = await DispenserSDK.dispense(enableAccount);
			alert (" Your account now have "+ result.amount + " micro Algos" );
		} catch (error) {
			alert(error);
		}
	}

	async function handleTransactionClick() {
		const token =
			process.env.REACT_APP_ALGO_CLIENT_TOKEN ||
			"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
		const server =
			process.env.REACT_APP_ALGO_CLIENT_SERVER || "http://localhost";
		const port = process.env.REACT_APP_ALGO_CLIENT_PORT || 4001;
		const algodv2 = new algosdk.Algodv2(token, server, port);
		const suggestedParams = await algodv2.getTransactionParams().do();
		// construct a transaction note
		const note = new Uint8Array(Buffer.from("Hello World", "utf8"));
		const addr = localStorage.getItem("enable_account");
		const receiver = process.env.REACT_APP_DAPP_ADDRESS || "OZL4D23EET2S44UJBHZGHSMUQPJSA5YK7X4J737N5QZUJY3WE4X6PFHIXE";
		if (addr == null) {
			alert("no address enable");
			return;
		}
		// create the transaction
		const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
			from: addr,
			to: receiver,
			amount: 10000,
			note,
			suggestedParams,
			// try adding another option to the list above by using TypeScript autocomplete (ctrl + space in VSCode)
		});
		let wTxn: WalletTransaction = {
			txn: Buffer.from(txn.toByte()).toString("base64"),
		};
		// Sign and post
		const res = await wallet.signAndPostTxns([wTxn]);
		console.log(res);
	}
	return (
		<ThemeProvider theme={theme}>
			<Container component="main" maxWidth="xs">
				
				<Card>
					<CardContent>
						<img src={VaultImage} height="32" />
					</CardContent>
					<CardContent>
						{ enableAccount? ( 
							<>
							<Typography>You have enable the following accounts:</Typography>
							<Typography>{ParseUtil.displayLongAddress(enableAccount)}</Typography>
							</>
						):(
							<Typography>Connect to FIDO Vault account</Typography>
						)}
					</CardContent>
					<CardActions>
						<Button size="small" onClick={handleEnableClick} variant="outlined">
							CONNECT
						</Button>
						<Button variant="outlined" size="small" href={wallet.baseURL+"/fe/register"} target="_blank" sx={{ml:2}}>
							SIGNUP NEW ACCOUNT	
						</Button>
					</CardActions>
				</Card>
				<Card sx={{mt:2}}>
					<CardMedia
						component="img"
						height="194"
						image={NFTImage}
						alt="Paella dish"
					/>
					<CardContent>Purchase this NFT for 0.01 ALGO</CardContent>
					<CardActions>
						<Button size="small" onClick={handleTransactionClick}>
							PURCHASE
						</Button>
					</CardActions>
				</Card>
				{ enableAccount &&
				
				<Card sx={{mt:2}}>
					<CardContent>

						<Typography variant="caption" >Deposit 10 ALGO to:</Typography>
						<Typography >{ParseUtil.displayLongAddress(enableAccount)}</Typography>

					</CardContent>
					<CardActions>
						<Button size="small" onClick={handleDispenserClick}>
							DEPOSIT
						</Button>
					</CardActions>
				</Card>
	}
			</Container>
		</ThemeProvider>
	);
}

export default App;
