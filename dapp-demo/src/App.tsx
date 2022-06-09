import React, { useEffect, useState } from "react";
import logo from "./logo.svg";
import "./App.css";
import {
	FidoVaultSDK,
	PostTxnsResult,
	WalletTransaction,
} from "./lib/LoginidVaultSDK";
import algosdk, { SuggestedParams } from "algosdk";
import NFTImage from "./assets/Onboarding-3.png";
import ExchangeImage from "./assets/AddAlgorandAccount.png";
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
	Paper,
	Stack,
} from "@mui/material";
import { DispenserSDK } from "./lib/DispenserSDK";
import { DisplayMessage } from "./lib/common/message";

const theme = createTheme();
const asset_id = parseInt(process.env.REACT_APP_ASSET_ID || "2");

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
		console.log(suggestedParams);
		return Promise.resolve(suggestedParams);
	}

	async function postTransaction(signTxns: string[]): Promise<boolean> {
		const token =
			process.env.REACT_APP_ALGO_CLIENT_TOKEN ||
			"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
		const server =
			process.env.REACT_APP_ALGO_CLIENT_SERVER || "http://localhost";
		const port = process.env.REACT_APP_ALGO_CLIENT_PORT || 4001;
		const algodv2 = new algosdk.Algodv2(token, server, port);
		console.log(signTxns);
		let signed = [];
		for (let txn of signTxns) {
			signed.push(Buffer.from(txn, "base64"));
		}
		let tx = await algodv2.sendRawTransaction(signed).do();
		console.log("Transaction : " + tx.txId);

		// Wait for transaction to be confirmed
		const confirmedTxn = await algosdk.waitForConfirmation(
			algodv2,
			tx.txId,
			4
		);
		//Get the completed Transaction
		console.log(
			"Transaction " +
				tx.txId +
				" confirmed in round " +
				confirmedTxn["confirmed-round"]
		);
		return true;
	}

	async function handleTransactionClick() {
		try {
			// construct a transaction note
			const note = new Uint8Array(Buffer.from("Simple Payment", "utf8"));
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
				amount: 1000000,
				note,
				suggestedParams: params,
				// try adding another option to the list above by using TypeScript autocomplete (ctrl + space in VSCode)
			});
			var leaseBuffer = new Uint8Array(32);
			window.crypto.getRandomValues(leaseBuffer);
			txn.addLease(leaseBuffer);
			let wTxn: WalletTransaction = {
				txn: Buffer.from(txn.toByte()).toString("base64"),
				signer: addr,
			};
			// Sign and post
			const res = await wallet.signTxns([wTxn]);
			const post = await postTransaction(res.signTxn);
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

	async function handleAssetOptinClick() {
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
			// create opt-in transaction
			const txn =
				algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
					from: addr,
					to: addr,
					amount: 0,
					assetIndex: asset_id,
					note,
					suggestedParams: params,
				});
			let wTxn: WalletTransaction = {
				txn: Buffer.from(txn.toByte()).toString("base64"),
				signer: addr,
			};
			// Sign and post
			const res = await wallet.signTxns([wTxn]);
			const post = await postTransaction(res.signTxn);
			console.log("result" + res);
			setDisplayMessage({ text: "optin complete!", type: "info" });
		} catch (error) {
			setDisplayMessage({
				text: (error as Error).message,
				type: "error",
			});
			console.log(error);
		}
	}

	async function handleGroupClick() {
		try {
			// construct a transaction note
			const note = new Uint8Array(Buffer.from("Test Asset", "utf8"));
			const addr = localStorage.getItem("enable_account");
			const dapp_addr =
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

			// create asset transfer transaction
			const txn1 =
				algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
					from: dapp_addr,
					to: addr,
					amount: 1,
					assetIndex: asset_id,
					note,
					suggestedParams: params,
				});

			// create payment transaction
			/*
			// create the transaction
			const txn1 = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
				from: dapp_addr,
				to: addr,
				amount: 15000,
				note,
				suggestedParams: params,
				// try adding another option to the list above by using TypeScript autocomplete (ctrl + space in VSCode)
			});
			*/

			// create payment transaction
			// create the transaction
			const txn2 = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
				from: addr,
				to: dapp_addr,
				amount: 10000,
				note,
				suggestedParams: params,
				// try adding another option to the list above by using TypeScript autocomplete (ctrl + space in VSCode)
			});

			let txns = [txn1, txn2];
			let txgroup = algosdk.assignGroupID(txns);
			console.log("groupID: ", txgroup[0].group?.toString("base64"));

			const txnb64_1 = Buffer.from(txgroup[0].toByte()).toString(
				"base64"
			);
			let wTxn1: WalletTransaction = {
				txn: txnb64_1,
			};

			const txnb64_2 = Buffer.from(txgroup[1].toByte()).toString(
				"base64"
			);
			let wTxn2: WalletTransaction = {
				txn: txnb64_2,
				signer: addr,
			};

			console.log(txgroup[0].txID(), " ", txgroup[1].txID());

			// Sign and post
			// need to sign
			const res = await wallet.signTxns([wTxn1, wTxn2]);
			let dis_res = await DispenserSDK.sign(txnb64_1);

			// submit group transaction
			//let signTxn = [...res.signTxn,dis_res.stxn]
			let signTxn = [dis_res.stxn, ...res.signTxn];
			//let signTxn = [dis_res.stxn, res.signTxn[0]]
			//let signTxn = [ res.signTxn[0], dis_res.stxn]
			//let signTxn = res.signTxn;
			//signTxn = signTxn.concat(dis_res.stxn);

			const post = await postTransaction(signTxn);
			//const post = await DispenserSDK.post(res.signTxn.concat(dis_res.stxn));
			console.log(post);
			setDisplayMessage({ text: "purchase complete!", type: "info" });
		} catch (error) {
			setDisplayMessage({
				text: (error as Error).message,
				type: "error",
			});
			console.log(error);
		}
	}

	async function handleGroupClick3() {
		try {
			// construct a transaction note
			const note = new Uint8Array(Buffer.from("Test Asset", "utf8"));
			const addr = localStorage.getItem("enable_account");
			const dapp_addr =
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

			// create asset transfer transaction
			const txn1 =
				algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
					from: addr,
					to: dapp_addr,
					amount: 1,
					assetIndex: asset_id,
					note,
					suggestedParams: params,
				});

			// create asset transfer transaction
			const txn3 =
				algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
					from: dapp_addr,
					to: addr,
					amount: 1,
					assetIndex: asset_id,
					note,
					suggestedParams: params,
				});

			// create payment transaction
			// create the transaction
			const txn2 = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
				from: addr,
				to: dapp_addr,
				amount: 10000,
				note,
				suggestedParams: params,
				// try adding another option to the list above by using TypeScript autocomplete (ctrl + space in VSCode)
			});

			let txns = [txn1, txn2, txn3];
			let txgroup = algosdk.assignGroupID(txns);
			console.log("groupID: ", txgroup[0].group?.toString("base64"));

			const txnb64_1 = Buffer.from(txgroup[0].toByte()).toString(
				"base64"
			);
			let wTxn1: WalletTransaction = {
				txn: txnb64_1,
				signer: addr,
			};

			const txnb64_2 = Buffer.from(txgroup[1].toByte()).toString(
				"base64"
			);
			let wTxn2: WalletTransaction = {
				txn: txnb64_2,
				signer: addr,
			};

			const txnb64_3 = Buffer.from(txgroup[2].toByte()).toString(
				"base64"
			);
			let wTxn3: WalletTransaction = {
				txn: txnb64_3,
				signer: addr,
			};

			// Sign and post
			// need to sign
			const res = await wallet.signTxns([wTxn1, wTxn2, wTxn3]);
			let dis_res = await DispenserSDK.sign(txnb64_3);

			// submit group transaction
			let signTxn = [...res.signTxn, dis_res.stxn];
			//let signTxn = [dis_res.stxn, ...res.signTxn]
			const post = await postTransaction(signTxn);
			//const post = await DispenserSDK.post(res.signTxn.concat(dis_res.stxn));
			console.log(post);
			setDisplayMessage({ text: "group complete!", type: "info" });
		} catch (error) {
			setDisplayMessage({
				text: (error as Error).message,
				type: "error",
			});
			console.log(error);
		}
	}

	async function handleAssetPurchaseClick() {
		try {
			// construct a transaction note
			const addr = localStorage.getItem("enable_account");
			const dapp_addr =
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

			// optin asset 2
			const note1 = new Uint8Array(Buffer.from("Opt-in to this asset", "utf8"));
			const note2 = new Uint8Array(Buffer.from("Make a payment", "utf8"));
			const note3 = new Uint8Array(Buffer.from("Receive this asset", "utf8"));
			const txn1 =
				algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
					from: addr,
					to: addr,
					amount: 0,
					assetIndex: asset_id,
					note: note1,
					suggestedParams: params,
				});

			// create payment transaction
			// create the transaction
			const txn2 = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
				from: addr,
				to: dapp_addr,
				amount: 1000000,
				note: note2,
				suggestedParams: params,
				// try adding another option to the list above by using TypeScript autocomplete (ctrl + space in VSCode)
			});

			var leaseBuffer = new Uint8Array(32);
			window.crypto.getRandomValues(leaseBuffer);
			txn2.addLease(leaseBuffer);
			// create asset transfer transaction
			const txn3 =
				algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
					from: dapp_addr,
					to: addr,
					amount: 1,
					assetIndex: asset_id,
					note: note3,
					suggestedParams: params,
				});
			window.crypto.getRandomValues(leaseBuffer);
			txn3.addLease(leaseBuffer);

			let txns = [txn1, txn2, txn3];
			let txgroup = algosdk.assignGroupID(txns);

			const txnb64_1 = Buffer.from(txgroup[0].toByte()).toString(
				"base64"
			);
			let wTxn1: WalletTransaction = {
				txn: txnb64_1,
				signer: addr,
			};

			const txnb64_2 = Buffer.from(txgroup[1].toByte()).toString(
				"base64"
			);
			let wTxn2: WalletTransaction = {
				txn: txnb64_2,
				signer: addr,
			};

			const txnb64_3 = Buffer.from(txgroup[2].toByte()).toString(
				"base64"
			);
			let wTxn3: WalletTransaction = {
				txn: txnb64_3,
				signer: addr,
			};

			// Sign and post
			// need to sign
			const res = await wallet.signTxns([wTxn1, wTxn2, wTxn3]);
			let dis_res = await DispenserSDK.sign(txnb64_3);

			// submit group transaction
			let signTxn = [...res.signTxn, dis_res.stxn];
			//let signTxn = [dis_res.stxn, ...res.signTxn]
			const post = await postTransaction(signTxn);
			//const post = await DispenserSDK.post(res.signTxn.concat(dis_res.stxn));
			console.log(post);
			setDisplayMessage({ text: "purchase complete!", type: "info" });
		} catch (error) {
			setDisplayMessage({
				text: (error as Error).message,
				type: "error",
			});
			console.log(error);
		}
	}

	async function handleGroupClick2() {
		try {
			// construct a transaction note
			const note = new Uint8Array(Buffer.from("Test Asset", "utf8"));
			const addr = localStorage.getItem("enable_account");
			const dapp_addr =
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

			// create asset transfer transaction
			const txn1 =
				algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
					from: dapp_addr,
					to: addr,
					amount: 1,
					assetIndex: asset_id,
					note,
					suggestedParams: params,
				});

			// create payment transaction
			// create the transaction
			const txn2 = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
				from: dapp_addr,
				to: addr,
				amount: 10000,
				note,
				suggestedParams: params,
				// try adding another option to the list above by using TypeScript autocomplete (ctrl + space in VSCode)
			});

			let txns = [txn1, txn2];
			let txgroup = algosdk.assignGroupID(txns);
			console.log("groupID: ", txgroup[0].group?.toString("base64"));

			const txnb64_1 = Buffer.from(txgroup[0].toByte()).toString(
				"base64"
			);
			let wTxn1: WalletTransaction = {
				txn: txnb64_1,
			};

			const txnb64_2 = Buffer.from(txgroup[1].toByte()).toString(
				"base64"
			);
			let wTxn2: WalletTransaction = {
				txn: txnb64_2,
				signer: addr,
			};

			console.log(txgroup[0].txID(), " ", txgroup[1].txID());

			// Sign and post
			//const res = await wallet.signTxns([wTxn1, wTxn2]);
			// need to sign
			let dis_res = await DispenserSDK.sign(txnb64_1);
			let dis_res2 = await DispenserSDK.sign(txnb64_2);

			// submit group transaction
			const post = await postTransaction([dis_res.stxn, dis_res2.stxn]);
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
					<CardHeader title="FIDO Vault Connect"></CardHeader>
					<CardContent>
						{enableAccount ? (
							<>
								<Typography>
									You have enabled the following accounts:
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

				{enableAccount && (
					<>
						<Card sx={{ mt: 2 }}>
							<CardHeader title="Exchange Demo"></CardHeader>
							<CardContent>
								<Typography variant="caption">
									Fund 100 ALGO to:
								</Typography>
								<Typography>
									{ParseUtil.displayLongAddress(
										enableAccount
									)}
								</Typography>
							</CardContent>
							<CardActions>
								<Button
									size="small"
									variant="outlined"
									onClick={handleDispenserClick}
								>
									BUY ALGO
								</Button>
								<Button
									size="small"
									variant="outlined"
									onClick={handleTransactionClick}
								>
									SEND ALGO
								</Button>
							</CardActions>
						</Card>
						<Card sx={{ mt: 2 }}>
							<CardHeader title="dApp Demo"></CardHeader>
							<CardMedia
								component="img"
								height="194"
								image={NFTImage}
								alt="Paella dish"
							/>

							<CardContent>
								<Stack>
									<Button
										size="small"
										variant="outlined"
										onClick={handleAssetPurchaseClick}
									>
										BUY ASSET
									</Button>
								</Stack>
							</CardContent>
						</Card>
					</>
				)}
			</Container>
		</ThemeProvider>
	);
}

export default App;
