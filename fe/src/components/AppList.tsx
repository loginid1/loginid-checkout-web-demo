import {
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogContentText,
	DialogTitle,
	Divider,
	Grid,
	IconButton,
	Stack,
	TextField,
	Typography,
} from "@mui/material";
import { useState } from "react";
import ParseUtil from "../lib/util/parse";
import { AssetRecord } from "../lib/VaultSDK/vault/algo";
import styles from "../styles/common.module.css";
import { ASAIcon } from "./ASAIcons";
import AssetOptionDialog from "./TxConfirmation/AssetOptinDialog";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import {
	AppList,
	CustomVaultApp,
	VaultApp,
} from "../lib/VaultSDK/vault/developer";
import { Link, useNavigate } from "react-router-dom";
import React from "react";
import GroupIcon from "@mui/icons-material/Group";

export function DisplayAppList(props: { appList: AppList | null }) {
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
		<Grid container spacing={1} justifyContent="left">
			<Grid item container xs={4}>
				<Typography variant="medium">Name</Typography>
			</Grid>
			<Grid item container xs={4}>
				<Typography variant="medium">Origins</Typography>
			</Grid>
			<Grid item container xs={2}>
				<Typography variant="medium">Updated At</Typography>
			</Grid>
			<Grid item container xs={2}>
				<Typography variant="medium">No. of Users</Typography>
			</Grid>
			<Grid item xs={12}>
				<Divider variant="fullWidth"></Divider>
			</Grid>
			{props.appList && props.appList.apps.map((app) => DisplayApp(app))}
		</Grid>
	);
}

export function DisplayApp(app: CustomVaultApp) {
	const navigate = useNavigate();
	return (
		<React.Fragment key={app.id}>
			<Grid item container xs={4}>
				<Link to={`/developer/app/${app.id}`}>{app.app_name}</Link>
			</Grid>
			<Grid item container xs={4}>
				{app.origins}
			</Grid>
			<Grid item container xs={2}>
				{ParseUtil.parseDate(app.uat)}
			</Grid>
			<Grid item container xs={2} alignItems="center" justifyContent="flex-start">
				<IconButton onClick={()=>navigate("/developer/member/"+app.id + "?name="+app.app_name)}>
					<GroupIcon />
				</IconButton>
				<Typography variant="body2">{app.user_count}</Typography>
			</Grid>
			<Grid item xs={12}>
				<Divider variant="fullWidth"></Divider>
			</Grid>
		</React.Fragment>
	);
}
