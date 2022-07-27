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
	Step,
	StepLabel,
	Stepper,
	SvgIcon,
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
import TxConfirmLogo from "../../assets/icon-1-exclamation.svg";
import TxApproveLogo from "../../assets/icon-2-checkmark.svg";
import AlgorandLogo from "../../assets/AlgorandLogo.svg";
import { ReactComponent as AlgoLogo } from "../../assets/AlgoLogo.svg";
import {
	AppCall,
	AppOptin,
	AssetOptin,
	AssetTransfer,
	BaseTransaction,
	PaymentTransaction,
	SignedTxn,
	TxnValidationResponse,
} from "../../lib/VaultSDK/vault/algo";
import { AuthService } from "../../services/auth";
import { Message, MessagingService } from "../../services/messaging";
import styles from "../../styles/common.module.css";
import { DisplayTransaction } from "../../components/TransactionConfirmation";

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

	const [stxns, setStxns] = useState<string[]>([]);
	const [txns, setTxns] = useState<BaseTransaction[]>([]);
	const [success, setSuccess] = useState<boolean>(false);
	const [validation, setValidation] = useState<TxnValidationResponse>();
	const [txSignCount, setTxSignCount] = useState<number>(0);
	const [txIndex, setTxIndex] = useState<number>(0);
	const [txLength, setTxLength] = useState<number>(1);
	const [steps, setSteps] = useState<string[]>([]);

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
				setValidation(txnValidation);
				setTxLength(txnValidation.txn_data.length);
				let sign_count = 0;

				let itxns = [];
				let isteps = [];

				for (let i = 0; i < txnValidation.txn_type.length; i++) {
					if (txnValidation.txn_type[i] === "payment") {
						let payment: PaymentTransaction = JSON.parse(
							txnValidation.txn_data[i]
						);
						payment.type = "payment";
						payment.iat = new Date().toISOString();
						itxns.push(payment);
						isteps.push("payment");
						if (payment.base.require) {
							sign_count++;
						}
					} else if (txnValidation.txn_type[i] === "asset-optin") {
						let assetOptin: AssetOptin = JSON.parse(
							txnValidation.txn_data[i]
						);
						assetOptin.type = "asset-optin";
						assetOptin.iat = new Date().toISOString();

						isteps.push("ASA optin");
						itxns.push(assetOptin);
						if (assetOptin.base.require) {
							sign_count++;
						}
					} else if (txnValidation.txn_type[i] === "asset-transfer") {
						let assetTx: AssetTransfer = JSON.parse(
							txnValidation.txn_data[i]
						);
						assetTx.type = "asset-transfer";
						assetTx.iat = new Date().toISOString();
						itxns.push(assetTx);
						isteps.push("ASA tx");
						if (assetTx.base.require) {
							sign_count++;
						}
					} else if (txnValidation.txn_type[i] === "app-optin") {
						let aTx: AppOptin = JSON.parse(
							txnValidation.txn_data[i]
						);
						aTx.type = "app-optin";
						aTx.iat = new Date().toISOString();
						itxns.push(aTx);
						isteps.push("App opt-in");
						if (aTx.base.require) {
							sign_count++;
						}
					} else if (txnValidation.txn_type[i] === "app-call") {
						let aTx: AppCall = JSON.parse(
							txnValidation.txn_data[i]
						);
						aTx.type = "app-call";
						aTx.iat = new Date().toISOString();
						itxns.push(aTx);
						isteps.push("App call");
						if (aTx.base.require) {
							sign_count++;
						}
					}
				}

				setTxSignCount(sign_count);
				setTxns(itxns);
				setSteps(isteps);
			} catch (error) {
				console.log("txValidation error: " + error);
				mService.sendErrorMessage(
					"Invalid Transaction request: " + error
				);
				setDisplayMessage({
					text: "Invalid transaction request: " + error,
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

	async function handleTxConfirm(txn: BaseTransaction) {
		try {
			let result: SignedTxn = await vaultSDK.txConfirmation(
				txn.base.username,
				txn.base.sign_payload,
				txn.base.sign_nonce,
				txn.base.raw_data,
				false
			);
			console.log(result);
			// clear old error message
			if (result) {
				let oldTxns = stxns;
				oldTxns.push(result.stxn);
				setStxns(oldTxns);
				if (oldTxns.length == txSignCount && txIndex == txLength - 1) {
					mService.sendMessageText(
						JSON.stringify({ signTxn: oldTxns })
					);
					setSuccess(true);
					setDisplayMessage({
						text: "transaction successful!!",
						type: "info",
					});
				}

				if (txIndex < txLength - 1) {
					setTxIndex(txIndex + 1);
				}
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

	function handleNext() {
		if (stxns.length == txSignCount && txIndex == txLength - 1) {
			mService.sendMessageText(JSON.stringify({ signTxn: stxns }));
			setSuccess(true);
			setDisplayMessage({
				text: "transaction successful!!",
				type: "info",
			});
		}

		if (txIndex < txLength - 1) {
			setTxIndex(txIndex + 1);
		}
	}
	async function handleCancel() {
		if (!success) {
			mService.sendErrorMessage("user cancel");
		}
		window.close();
	}
	return (
		<ThemeProvider theme={theme}>
			<Box>
				<AppBar position="static">
					<Toolbar>
						<Grid
							container
							spacing={1}
							justifyContent="center"
							alignItems="center"
						>
							<Grid item xs={8} sx={{ "text-align": "left" }}>
								<img src={VaultLogo} width="160" height="30" />
							</Grid>
							{success ? (
								<Grid
									item
									xs={4}
									justifyContent="center"
									alignItems="center"
									sx={{
										"text-align": "left",
										display: "inline-flex",
									}}
								>
									<img
										src={TxApproveLogo}
										width="40"
										height="40"
									/>
									<Typography sx={{ m: 1 }}>
										Approved!
									</Typography>
								</Grid>
							) : (
								<Grid
									item
									xs={4}
									justifyContent="center"
									alignItems="center"
									sx={{
										"text-align": "left",
										display: "inline-flex",
									}}
								>
									<img
										src={TxConfirmLogo}
										width="40"
										height="40"
									/>
									<Typography sx={{ m: 1 }}>
										Approve Transaction?
									</Typography>
								</Grid>
							)}
						</Grid>
					</Toolbar>
				</AppBar>

				<Box sx={{ mt: 4, ml: 4, mr: 4 }}>
					<DisplayGroupStep
						steps={steps}
						current={txIndex}
						max={txLength}
					></DisplayGroupStep>
					<DisplayTransaction
						{...txns[txIndex]!}
					></DisplayTransaction>
					<Grid container spacing={1}>
						<DisplayButtons
							complete={success}
							current={txIndex}
							max={txLength}
							confirm={txns[txIndex]?.base.require}
							onClose={handleCancel}
							onNext={handleNext}
							onSign={() => handleTxConfirm(txns[txIndex]!)}
						></DisplayButtons>

						<Grid item xs={12}>
							<Divider variant="fullWidth" />
						</Grid>

						<Grid item xs={12}>
							<Typography variant="caption">
								Request from: {validation?.origin}
							</Typography>
						</Grid>
					</Grid>
				</Box>
			</Box>
		</ThemeProvider>
	);
}

interface DisplayGroupStepProps {
	current: number;
	max: number;
	steps: string[];
}
function DisplayGroupStep(props: DisplayGroupStepProps) {
	if (props.max == 1) {
		return <></>;
	} else if (props.max < 4) {
		console.log("here " + props.steps.length);
		return (
			<Stepper sx={{ mb: 2 }} activeStep={props.current} alternativeLabel>
				{props.steps.map((label) => (
					<Step key={label}>
						<StepLabel>{label}</StepLabel>
					</Step>
				))}
			</Stepper>
		);
	} else {
		return <p>{props.current + 1 / props.max}</p>;
	}
}

interface DisplayButtonProps {
	current: number;
	max: number;
	confirm: boolean;
	complete: boolean;
	onSign: () => void;
	onNext: () => void;
	onClose: () => void;
}
function DisplayButtons(props: DisplayButtonProps) {
	let nextLabel = "next";
	if (props.current === props.max - 1) {
		nextLabel = "confirm";
	}
	if (props.confirm) {
		return (
			<>
				<Grid item xs={6}>
					<Button
						fullWidth
						variant="outlined"
						onClick={props.onClose}
						sx={{ mt: 1, mb: 1 }}
					>
						Close
					</Button>
				</Grid>
				<Grid item xs={6}>
					<Button
						fullWidth
						variant="contained"
						onClick={props.onSign}
						sx={{ mt: 1, mb: 1 }}
						disabled={props.complete}
					>
						Sign
					</Button>
				</Grid>
			</>
		);
	} else {
		return (
			<>
				<Grid item xs={6}>
					<Button
						fullWidth
						variant="outlined"
						onClick={props.onClose}
						sx={{ mt: 1, mb: 1 }}
					>
						Close
					</Button>
				</Grid>
				<Grid item xs={6}>
					<Button
						fullWidth
						variant="contained"
						onClick={props.onNext}
						sx={{ mt: 1, mb: 1 }}
						disabled={props.complete}
					>
						{nextLabel}
					</Button>
				</Grid>
			</>
		);
	}
}

function AlgoIcon(props: any) {
	return <SvgIcon {...props} component={AlgoLogo} inheritViewBox></SvgIcon>;
}
