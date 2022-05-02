import {
	Alert,
	AlertColor,
	AppBar,
	Box,
	Button,
	Container,
	createTheme,
	Divider,
	Grid,
	Icon,
	ThemeProvider,
	Toolbar,
	Typography,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import { Outlet, Navigate, useNavigate } from "react-router-dom";
import { EnableOpts, WalletTransaction } from "../../lib/common/api";
import { DisplayMessage } from "../../lib/common/message";
import ParseUtil from "../../lib/util/parse";
import vaultSDK from "../../lib/VaultSDK";
import VaultLogo from "../../assets/logo_dark.svg";
import {
	PaymentTransaction,
	SignedTxn,
	TxnValidationResponse,
} from "../../lib/VaultSDK/vault/algo";
import { AuthService } from "../../services/auth";
import { Message, MessagingService } from "../../services/messaging";
import styles from "../../styles/common.module.css";

const mService = new MessagingService(window.opener);
const theme = createTheme({
	typography: {
		subtitle1: {
			fontWeight: 600,
		},
	},
});
let transactions: WalletTransaction[] = [];
export default function WalletTxnConfirmation() {
	const navigate = useNavigate();
	//   const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
	const [displayMessage, setDisplayMessage] = useState<DisplayMessage | null>(
		null
	);
	const [payment, setPayment] = useState<PaymentTransaction | null>(null);
	const [username, setUsername] = useState<string>("");
	useEffect(() => {
		console.log("init " + transactions.length);
		let target = window.opener;
		if (target != null) {
			mService.onMessage((msg, origin) => onMessageHandle(msg, origin));
			checkSession();
		} else {
			setDisplayMessage({ text: "Missing dApp origin", type: "error" });
			//navigate("/login");
		}
	}, []);

	// check if account is authorized to interac with dDapp
	async function checkSession() {
		let result = await waitForInput();
		if (result == true) {
			// check signer permission
			try {
				let txnValidation: TxnValidationResponse =
					await vaultSDK.txnValidation(transactions, mService.origin);
				console.log("valid: " + JSON.stringify(txnValidation));
				if (txnValidation.txn_type[0] === "payment") {
					let payment: PaymentTransaction = JSON.parse(
						txnValidation.txn_data[0]
					);

					payment.iat = new Date().toISOString();

					console.log(payment);
					setPayment(payment);
					setUsername(txnValidation.username);
				}
			} catch (error) {
				console.log("txValidation error: " + error);
				mService.sendErrorMessage("Invalid Transaction request");
				setDisplayMessage({
					text: "Invalid transaction request",
					type: "error",
				});
			}
		} else {
			mService.sendErrorMessage("Missing transaction request - timeout");
			setDisplayMessage({
				text: "Missing transaction request - timeout",
				type: "error",
			});
		}
	}

	const INTERVAL = 100;
	const TIMEOUT = 10000;
	async function waitForInput(): Promise<boolean> {
		let wait = TIMEOUT;
		while (wait > 0) {
			if (transactions.length == 0) {
				await new Promise((resolve) => setTimeout(resolve, INTERVAL));
			} else {
				return Promise.resolve(true);
			}
			wait = wait - INTERVAL;
		}
		return Promise.resolve(false);
	}

	function onMessageHandle(msg: Message, origin: string) {
		try {
			mService.origin = origin;
			mService.id = msg.id;
			let wTxns: WalletTransaction[] = JSON.parse(msg.data);
			console.log(wTxns);
			// validate enable
			if (wTxns.length > 0) {
				//setTransactions(wTxns);
				transactions = wTxns;
				console.log(transactions.length);
			} else {
				setDisplayMessage({ text: "no transactions", type: "error" });
			}
		} catch (error) {
			console.log(error);
		}
	}

	async function handleTxConfirm() {
		try {
			let result: SignedTxn = await vaultSDK.txConfirmation(
				username,
				payment!.sign_payload,
				payment!.sign_nonce,
				payment!.raw_data,
				true
			);
			console.log(result);
			// clear old error message
			if (result) {
				mService.sendMessageText(JSON.stringify(result));
				setDisplayMessage({
					text: "transaction successful!!",
					type: "info",
				});
			} else {
				mService.sendErrorMessage("transaction failed");
				setDisplayMessage({
					text: "transaction failed!!",
					type: "error",
				});
			}
		} catch (error) {
			//console.log("error " + (error as Error).message);
			mService.sendErrorMessage((error as Error).message);
			setDisplayMessage({
				text: (error as Error).message,
				type: "error",
			});
		}
	}
	async function handleCancel() {
		mService.sendErrorMessage("user cancel");
		window.close();
	}
	return (
		<ThemeProvider theme={theme}>
			<Box>
				<AppBar position="static">
					<Toolbar>
							<img src={VaultLogo} width="160" height="30"/>
					</Toolbar>	
				</AppBar>

				{displayMessage && (
					<Alert
						severity={
							(displayMessage?.type as AlertColor) || "info"
						}
						sx={{ mt: 4 }}
					>
						{displayMessage.text}
					</Alert>
				)}

				<Box sx={{ mt: 4, ml: 4, mr: 4 }}>
					<Grid container spacing={1}>
						{payment && (
							<>
								<Grid item xs={12}>
									<Typography variant="h6">
										Transaction Details
									</Typography>
								</Grid>
								<Grid item xs={12}>
									<Typography variant="subtitle2">
										{payment.iat}
									</Typography>
								</Grid>
								<Grid item xs={12}>
									<Divider
										variant="fullWidth"
										sx={{ background: "#2870FA" }}
									/>
								</Grid>
								<Grid item xs={6} sx={{ "text-align": "left" }}>
									<Typography variant="subtitle1">
										Transfer:
									</Typography>
								</Grid>
								<Grid item xs={6} sx={{ "text-align": "left" }}>
									<Typography variant="body1">
										mALGO (micro Algos)
									</Typography>
								</Grid>
								<Grid item xs={6} sx={{ "text-align": "left" }}>
									<Typography variant="subtitle1">
										Amount:
									</Typography>
								</Grid>
								<Grid item xs={6} sx={{ "text-align": "left" }}>
									<Typography variant="body1">
										{ParseUtil.displayAlgo(payment.amount)}
									</Typography>
								</Grid>
								<Grid item xs={6} sx={{ "text-align": "left" }}>
									<Typography variant="subtitle1">
										From:
									</Typography>
								</Grid>
								<Grid item xs={6} sx={{ "text-align": "left" }}>
									<Typography variant="body1">
									{ParseUtil.displayAddress(payment.from)}
									</Typography>
								</Grid>
								<Grid item xs={6} sx={{ "text-align": "left" }}>
									<Typography variant="subtitle1">
										To:
									</Typography>
								</Grid>
								<Grid item xs={6} sx={{ "text-align": "left" }}>
									<Typography variant="body1">
									{ParseUtil.displayAddress(payment.to)}
									</Typography>
								</Grid>
								<Grid item xs={6} sx={{ "text-align": "left" }}>
									<Typography variant="subtitle1">
										Fee:
									</Typography>
								</Grid>
								<Grid item xs={6} sx={{ "text-align": "left" }}>
									<Typography variant="body1">
									{ParseUtil.displayAlgo(payment.fee)}
									</Typography>
								</Grid>
							</>
						)}
						<Grid item xs={6}>
							<Button
								fullWidth
								variant="outlined"
								onClick={handleCancel}
								sx={{ mt: 1, mb: 1 }}
							>
								Cancel
							</Button>
						</Grid>
						<Grid item xs={6}>
							<Button
								fullWidth
								variant="contained"
								onClick={handleTxConfirm}
								sx={{ mt: 1, mb: 1 }}
							>
								Approve
							</Button>
						</Grid>
					</Grid>
				</Box>
			</Box>
		</ThemeProvider>
	);
}

function AlgoTransactionConfirmation() {
	return <div>Transaction</div>;
}
