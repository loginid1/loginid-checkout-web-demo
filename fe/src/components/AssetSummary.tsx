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
import AssetOptionDialog from "./TxConfirmation/AssetOptin";

export function DisplayAssets(assets: AssetRecord[], address: string) {
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
		<Grid container sx={{ m: 1 }} spacing={1} justifyContent="left">
			<Grid container item xs={12} justifyContent="right">
				<Button variant="contained" onClick={() => openAddAsset()}>
					+ Add ASA
				</Button>
                <AssetOptionDialog open={open} handleClose={handleClose} address={address}></AssetOptionDialog>
			</Grid>
			<Grid item container xs={2}>
				<Typography variant="medium">ID</Typography>
			</Grid>
			<Grid item container xs={6}>
				<Typography variant="medium">Name</Typography>
			</Grid>
			<Grid item container xs={4}>
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
			<Grid item container xs={6} justifyContent="left">
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
			<Grid item container xs={4}>
				{asset.amount}
			</Grid>
		</>
	);
}
