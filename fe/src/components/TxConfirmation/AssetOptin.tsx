import {
	Alert,
	AlertColor,
	AppBar,
	Box,
	Button,
	Container,
	createTheme,
	Dialog,
	DialogActions,
	DialogContent,
	DialogContentText,
	DialogProps,
	DialogTitle,
	Divider,
	FormControl,
	FormHelperText,
	Grid,
	Icon,
	Input,
	InputLabel,
	Step,
	StepLabel,
	Stepper,
	SvgIcon,
	TextField,
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
import styles from "../../styles/common.module.css";
import { ASAIcon } from "../ASAIcons";
import ts from "typescript";

const theme = createTheme({
	typography: {
		subtitle1: {
			fontWeight: 600,
		},
	},
});
let transactions: WalletTransaction[] = [];

interface AddAssetDialog extends DialogProps {
	address: string;
	handleClose: () => void;
}
export default function AssetOptionDialog(props: AddAssetDialog) {
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
	const [assetId, setAssetId] = useState<number | null>(null);
	const [assetTxn, setAssetTxn] = useState<AssetOptin | null>(null);
	const [open, setOpen] = useState(props.open);

	//useEffect(() => {setOpen(props.open)} );

	const handleAssetChange = async (
		event: React.ChangeEvent<HTMLInputElement>
	) => {
		const origin = window.location.origin;
		const token = AuthService.getToken();
		let asset_id = parseInt(event.target.value);
		setAssetId(asset_id);
		try {
			if (token) {
				const myTxn = await vaultSDK.addAsset(
					token,
					asset_id,
					props.address,
					origin
				);
				let assetOptin: AssetOptin = JSON.parse(myTxn.txn_data[0]);
				console.log(assetOptin);
				setAssetTxn(assetOptin);
				setDisplayMessage(null);
			} else {
				setDisplayMessage({ type: "error", text: "no authorized" });
				setAssetTxn(null);
			}
		} catch (error) {
			setDisplayMessage({
				text: (error as Error).message,
				type: "error",
			});
			setAssetTxn(null);
		}
	};

	async function handleTxConfirm() {
		try {
			let result: SignedTxn = await vaultSDK.txConfirmation(
				assetTxn!.base.username,
				assetTxn!.base.sign_payload,
				assetTxn!.base.sign_nonce,
				assetTxn!.base.raw_data,
				true
			);
			// clear old error message
			if (result) {
					setSuccess(true);
					setDisplayMessage({
						text: "transaction successful!!",
						type: "info",
					});

			} else {
				setDisplayMessage({
					text: "transaction failed!!",
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
		}
		props.handleClose();
	}
	return (
		<Dialog open={props.open} onClose={handleCancel}>
			<DialogTitle>Enter asset ID to add to your account</DialogTitle>
			<DialogContent>
				<Grid container spacing={1}>
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
								(displayMessage?.type as AlertColor) || "info"
							}
							sx={{ mt: 4, width:'100%' }}
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
							label="Asset ID"
							type="number"
							fullWidth
							variant="standard"
							value={assetId}
							onChange={handleAssetChange}
						/>
					</Grid>
				</Grid>
				{assetTxn && DisplayAssetOptin(assetTxn)}
			</DialogContent>
			<DialogActions>
				<Button onClick={handleCancel}>Cancel</Button>
				{assetTxn &&
				<Button onClick={handleTxConfirm}>Add</Button>
				}
			</DialogActions>
		</Dialog>
	);

	function DisplayAddAssetInput() {
		return (
			<>
				<Typography>Enter asset ID to add to your wallet</Typography>
				<FormControl error variant="standard">
					<InputLabel htmlFor="component-error">Name</InputLabel>
					<Input
						id="component-error"
						value={assetId}
						onChange={handleAssetChange}
						aria-describedby="component-error-text"
					/>
					<FormHelperText id="component-error-text">
						Error
					</FormHelperText>
				</FormControl>
			</>
		);
	}
}

function DisplayAssetOptin(txn: AssetOptin) {
	return (
		<Grid container spacing={1}>
			<Grid item xs={12}>
				<Typography variant="h6">Press "Add" to Opt-in:</Typography>
			</Grid>
			<Grid item xs={6} sx={{ "text-align": "left" }}>
				<Typography variant="subtitle1">Asset Info:</Typography>
			</Grid>
			<Grid item container xs={6} alignItems="left">
				<ASAIcon
					name={txn.unit+"-"+txn.assetid.toString()}
				></ASAIcon>
				&nbsp;{txn.unit? txn.unit: txn.name} 
			</Grid>
			<Grid item xs={6} sx={{ "text-align": "left" }}>
				<Typography variant="subtitle1">My Account:</Typography>
			</Grid>
			<Grid item xs={6} sx={{ "text-align": "left" }}>
				<Typography variant="body1">
					{ParseUtil.displayAddress(txn.base.from)}
				</Typography>
			</Grid>
			<Grid item xs={6} sx={{ "text-align": "left" }}>
				<Typography variant="subtitle1">Fee:</Typography>
			</Grid>
			<Grid item xs={6} sx={{ "text-align": "left" }}>
				<Typography variant="body1">
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
