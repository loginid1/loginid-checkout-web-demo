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
import { AppList, VaultApp } from "../lib/VaultSDK/vault/developer";
import { Link, useNavigate } from "react-router-dom";

export function DisplayAppList(props: {appList: AppList | null}) {
	const [open, setOpen] = useState(false);
	const navigate = useNavigate();

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
			<Grid item container xs={4}>
				<Typography variant="medium">Name</Typography>
			</Grid>
			<Grid item container xs={5}>
				<Typography variant="medium">Origins</Typography>
			</Grid>
			<Grid item container xs={3}>
				<Typography variant="medium">Updated At</Typography>
			</Grid>
			<Grid item xs={12}>
				<Divider variant="fullWidth"></Divider>
			</Grid>
			{props.appList && props.appList.apps.map((app) => DisplayApp(app))}
		</Grid>
	);
}

export function DisplayApp(app: VaultApp) {
	return (
		<>
			<Grid item container xs={4}>
				<Link to={`/developer/app/${app.id}`}>{app.app_name}</Link>
			</Grid>
			<Grid item container xs={5}>
				{app.origins}
			</Grid>
			<Grid item container xs={3}>
				{ParseUtil.parseDate( app.uat)}
			</Grid>
			<Grid item xs={12}>
				<Divider variant="fullWidth"></Divider>
			</Grid>
		</>
	);
}
