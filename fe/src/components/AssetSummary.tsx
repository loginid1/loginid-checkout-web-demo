import {
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogContentText,
	DialogTitle,
	Divider,
	Grid,
	Stack,
	TextField,
	Typography,
} from "@mui/material";
import { useState } from "react";
import ParseUtil from "../lib/util/parse";
import { AssetRecord } from "../lib/VaultSDK/vault/algo";
import styles from "../styles/common.module.css";
import { ASAIcon  } from "./ASAIcons";
import AssetOptionDialog from "./TxConfirmation/AssetOptinDialog";
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

export function DisplayAssets(assets: AssetRecord[], address: string, refresh?: ()=>void) {
	const [open, setOpen] = useState(false);

	const handleClickOpen = () => {
		setOpen(true);
	};

	const handleClose = () => {
		setOpen(false);
	};

	function openAddAsset() {
		setOpen(true);
	}

	return (
		<Grid container  spacing={1} justifyContent="left">
			<Grid container item xs={12} justifyContent="right">
				<Button variant="contained" endIcon={<ArrowForwardIcon/>} onClick={() => openAddAsset()}>
					Add Asset 
				</Button>
                <AssetOptionDialog open={open} handleClose={handleClose} handleSuccess={refresh} address={address}></AssetOptionDialog>
			</Grid>
			<Grid item container xs={2}>
				<Typography variant="medium">ID</Typography>
			</Grid>
			<Grid item container xs={5}>
				<Typography variant="medium">Name</Typography>
			</Grid>
			<Grid item container xs={5}>
				<Typography variant="medium">Balance</Typography>
			</Grid>
			<Grid item xs={12}>
				<Divider variant="fullWidth"></Divider>
			</Grid>
			{assets && assets.map((asset) => DisplayShortAsset(asset))}
		</Grid>
	);
}

export function DisplayShortAsset(asset: AssetRecord) {
	return (
		<>
			<Grid item container xs={2}>
				{asset.id}
			</Grid>
			<Grid item container xs={5} justifyContent="left">
				{/*
				<MyIcon
			name={asset.unit +"-"+asset.id.toString()}
			fill="red"
					color="secondary"
	></MyIcon>*/}
				{
				<ASAIcon
					name={asset.unit +"-"+asset.id.toString()}
				></ASAIcon>
			 }	
				&nbsp;{asset.unit? asset.unit: asset.name} 
			</Grid>
			<Grid item container xs={5}>
				{asset.amount}
			</Grid>
			<Grid item xs={12}>
				<Divider variant="fullWidth"></Divider>
			</Grid>
		</>
	);
}
