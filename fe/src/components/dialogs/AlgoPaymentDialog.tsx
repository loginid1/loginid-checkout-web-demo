import {
	Alert,
	AlertColor,
	AppBar, Button, createTheme,
	Dialog,
	DialogActions,
	DialogContent, DialogProps, Divider,
	FormControl,
	FormHelperText,
	Grid, Input,
	InputLabel,
	Step,
	StepLabel,
	Stepper,
	SvgIcon,
	TextField, Toolbar,
	Typography
} from "@mui/material";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ReactComponent as AlgoLogo } from "../../assets/AlgoLogo.svg";
import menuHeader from "../../assets/background.svg";
import VaultLogo from "../../assets/logo-inverted.svg";
import { WalletTransaction } from "../../lib/common/api";
import { DisplayMessage } from "../../lib/common/message";
import ParseUtil from "../../lib/util/parse";
import ValidateUtil from "../../lib/util/validate";
import vaultSDK from "../../lib/VaultSDK";
import {
	AssetOptin,
	PaymentTransaction,
	SignedTxn
} from "../../lib/VaultSDK/vault/algo";
import { AuthService } from "../../services/auth";
import { ASAIcon } from "../ASAIcons";

const theme = createTheme({
	typography: {
		subtitle1: {
			fontWeight: 600,
		},
	},
});
let transactions: WalletTransaction[] = [];

interface PaymentDialogProps extends DialogProps {
	address: string;
	amount: string;
	handleClose: () => void;
	handleSuccess?: () => void;
	handleRefresh?: () => void;
}
export default function AlgoPaymentDialog(props: PaymentDialogProps) {
	const navigate = useNavigate();
	//   const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
	const [displayMessage, setDisplayMessage] = useState<DisplayMessage | null>(
		null
	);

	const [stxns, setStxns] = useState<string[]>([]);
	const [success, setSuccess] = useState<boolean>(false);
	const [txSignCount, setTxSignCount] = useState<number>(0);
	const [txIndex, setTxIndex] = useState<number>(0);
	const [txLength, setTxLength] = useState<number>(1);
	const [toAddress, setToAddress] = useState<string>("");
	const [amount, setAmount] = useState<number>(0);
	const [txn, setTxn] = useState<PaymentTransaction | null>(null);

	//useEffect(() => {setOpen(props.open)} );

	const handleAddressChange = async (
		event: React.ChangeEvent<HTMLInputElement>
	) => {
		const origin = window.location.origin;
		const token = AuthService.getToken();
		let address = event.target.value;
		if (ValidateUtil.isAlgorandAddress(address)  && amount > 1000) {
			setToAddress(address);

			try {
				if (token) {
					const myTxn = await vaultSDK
					.createSendPayment(
						token,
						props.address,
						address,
						amount,
						origin
					);
					let assetOptin: PaymentTransaction = JSON.parse(myTxn.txn_data[0]);
					setTxn(assetOptin);
					setDisplayMessage(null);
				} else {
					setDisplayMessage({ type: "error", text: "no authorized" });
					setTxn(null);
				}
			} catch (error) {
				setDisplayMessage({
					text: (error as Error).message,
					type: "error",
				});
				setTxn(null);
			}
		}
	};

	async function handleTxConfirm() {
		try {
			let result: SignedTxn = await vaultSDK.txConfirmation(
				txn!.base.username,
				txn!.base.sign_payload,
				txn!.base.sign_nonce,
				txn!.base.raw_data,
				true
			);
			// clear old error message
			if (result) {
				setSuccess(true);
				setDisplayMessage({
					text: "transaction successful!",
					type: "info",
				});
				if (props.handleSuccess) {
					props.handleSuccess();
				}
			} else {
				setDisplayMessage({
					text: "transaction failed!",
					type: "error",
				});
			}
		} catch (error) {
			//console.log("error " + (error as Error).message);
			setDisplayMessage({
				text: (error as Error).message,
				type: "error",
			});
		}
	}

	function handleNext() {
		if (stxns.length == txSignCount && txIndex == txLength - 1) {
			setSuccess(true);
			setDisplayMessage({
				text: "transaction successful!",
				type: "info",
			});
		}

		if (txIndex < txLength - 1) {
			setTxIndex(txIndex + 1);
		}
	}
	async function handleCancel() {
		if (!success) {
		}
		props.handleClose();
	}
	return (
		<Dialog
			open={props.open}
			onClose={handleCancel}
			maxWidth="xs"
			fullWidth
		>
			<AppBar position="static">
				<Toolbar sx={{backgroundImage: `url(${menuHeader})`,
            backgroundSize: "cover",}}>
					<Grid
						container
						spacing={1}
						justifyContent="center"
						alignItems="center"
					>
						<Grid item>
							<img src={VaultLogo} width="160" height="30" />
						</Grid>
					</Grid>
				</Toolbar>
			</AppBar>
			<DialogContent>
				<Grid container spacing={1} sx={{ display: "flex" }}>
					{/*}
					<Grid item xs={12}>
						<Typography variant="h6">
							Enter asset ID to add to your wallet
						</Typography>
	</Grid>*/}
					<Grid item container xs={12}>
						{displayMessage && (
							<Alert
								severity={
									(displayMessage?.type as AlertColor) ||
									"info"
								}
								sx={{ mt: 2, width: "100%" }}
							>
								{displayMessage.text}
							</Alert>
						)}
					</Grid>
					<Grid item container xs={12}>
						<TextField
							autoFocus
							margin="dense"
							id="name"
							label="Enter reciever address  "
							fullWidth
							variant="outlined"
							value={toAddress}
							onChange={handleAddressChange}
							sx={{ ml: 2, mr: 2 }}
						/>
					</Grid>
					<Grid item container xs={12}>
						<TextField
							autoFocus
							margin="dense"
							id="name"
							label="Enter amount in micro Algo"
							type="number"
							variant="outlined"
							value={amount}
							sx={{ ml: 2, mr: 2 }}
						/>
					</Grid>
					<Grid item xs={12} sx={{ m: 2 }}>
						<Divider variant="fullWidth"></Divider>
					</Grid>
				</Grid>
			</DialogContent>
			<DialogActions sx={{ justifyContent: "center", mb: 2 }}>
				<Button onClick={handleCancel} variant="outlined">
					Cancel
				</Button>
				{txn && (
					<Button variant="contained" onClick={handleTxConfirm}>
						Confirm Payment
					</Button>
				)}
			</DialogActions>
		</Dialog>
	);

}

function DisplayAssetOptin(txn: AssetOptin) {
	return (
		<Grid
			container
			item
			xs={12}
			spacing={2}
			sx={{ m: 2, p: 2, backgroundColor: "#F2F6FF" }}
		>
			<Grid item container xs={12} justifyContent="center">
				<Typography variant="h0">Transaction Details</Typography>
			</Grid>
			<Grid item xs={6} sx={{ "text-align": "left" }}>
				<Typography variant="title_light">Asset Infomation</Typography>
			</Grid>
			<Grid item container xs={6} alignItems="left">
				<ASAIcon
					name={txn.unit + "-" + txn.assetid.toString()}
				></ASAIcon>
				&nbsp;{txn.unit ? txn.unit : txn.name}
			</Grid>
			<Grid item xs={6} sx={{ "text-align": "left" }}>
				<Typography variant="title_light">My Account</Typography>
			</Grid>
			<Grid item xs={6} sx={{ "text-align": "left" }}>
				<Typography variant="body1">
					{ParseUtil.displayLongAddress(txn.base.from)}
				</Typography>
			</Grid>
			<Grid item xs={6} sx={{ "text-align": "left" }}>
				<Typography variant="title">Fee</Typography>
			</Grid>
			<Grid item xs={6} sx={{ "text-align": "left" }}>
				<Typography variant="body1" sx={{fontWeight:600}}>
					{ParseUtil.convertAlgo(txn.base.fee)}{" "}
					<AlgoIcon color="primary" sx={{ fontSize: 14 }} />
				</Typography>
			</Grid>
		</Grid>
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
