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
import { useEffect, useState } from "react";
import ParseUtil from "../lib/util/parse";
import { AssetRecord } from "../lib/VaultSDK/vault/algo";
import styles from "../styles/common.module.css";
import { ASAIcon } from "./ASAIcons";
import AssetOptionDialog from "./TxConfirmation/AssetOptinDialog";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import {
	AppList,
	AppUserConsent,
	CustomVaultApp,
	VaultApp,
} from "../lib/VaultSDK/vault/developer";
import { Link, useNavigate } from "react-router-dom";
import React from "react";
import { DataGrid, GridColDef, GridPaginationModel, GridValueGetterParams } from "@mui/x-data-grid";
import { AuthService } from "../services/auth";
import vaultSDK from "../lib/VaultSDK";

export function DisplayAppUserList(props: { appId: string }) {
	const [paginationModel, setPaginationModel] = React.useState<GridPaginationModel>({
		page: 0,
		pageSize: 0,
	});

	const [rowCountState, setRowCountState] = React.useState(0);

	const columns: GridColDef[] = [
		{
			field: "username",
			headerName: "User",
			flex: 1,
			sortable: false,
			headerClassName: "header-classname",
		},
		{
			field: "attributes",
			headerName: "Consented to",
			flex: 0.3,
			sortable: false,
			headerClassName: "header-classname",
		},
		{
			field: "uat",
			headerName: "Joined at",
			flex: 0.3,
			sortable: false,
			headerClassName: "header-classname",
			valueGetter: (params) => {
				return ParseUtil.parseDate(params.value);
			},
		},
		{
			field: "status",
			headerName: "Status",
			flex: 0.3,
			sortable: false,
			headerClassName: "header-classname",
			valueGetter: (params) => {
				if (params.value === 0) {
					return "disable";
				} else if (params.value === 13) {
					return "banned";
				} else {
					return "active";
				}
			},
		},
	];

	const [row, setRow] = useState<AppUserConsent[]>([]);


	useEffect(() => {
		initAppUserList();
	}, []);


	function handlePaginationModelChange (newPaginationModel: GridPaginationModel)  {
		  setPaginationModel(newPaginationModel);
		  getAppUserList(paginationModel.page);
	  };
	

	async function initAppUserList() {
		const token = AuthService.getToken();
		if (token) {
			try {
				const result = await vaultSDK.getAppUserList(
					token,
					props.appId,
					0	
				);
				if (result.users) {
					setRow(result.users);
					setPaginationModel({
						page: result.offset,
						pageSize: result.limit,
					});
					setRowCountState(result.count);
				}
			} catch (error) {
				console.log((error as Error).message);
			}
		}
	}
	

	async function getAppUserList(page: number) {
		const offset = page * paginationModel.pageSize;
		const token = AuthService.getToken();
		if (token) {
			try {
				const result = await vaultSDK.getAppUserList(
					token,
					props.appId,
					offset
				);
				if (result.users) {
					setRow(result.users);
				}
			} catch (error) {
				console.log((error as Error).message);
			}
		}
	}


	return (
		<DataGrid
			columns={columns}
			rows={row}
			rowCount={rowCountState}
			pageSizeOptions={[paginationModel.pageSize]}
			paginationModel={paginationModel}
			paginationMode="server"
			onPaginationModelChange={handlePaginationModelChange}
			disableColumnMenu
			autoHeight
			sx={{
				"& .header-classname": {
					color: "primary.main",
					fontWeight: "bold",
				},
			}}
		/>
	);
}

export function DisplayApp(app: CustomVaultApp) {
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
			<Grid item container xs={2}>
				{app.user_count}
			</Grid>
			<Grid item xs={12}>
				<Divider variant="fullWidth"></Divider>
			</Grid>
		</React.Fragment>
	);
}
