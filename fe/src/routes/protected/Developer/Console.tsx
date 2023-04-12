import { Add, ContentCopy } from "@mui/icons-material";
import {
	Grid,
	Typography,
	Button,
	Paper,
} from "@mui/material";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DisplayAppList } from "../../../components/AppList";
import { VaultBase } from "../../../components/VaultBase";
import vaultSDK from "../../../lib/VaultSDK";
import { AppList } from "../../../lib/VaultSDK/vault/developer";
import { AuthService } from "../../../services/auth";

export default function DeveloperConsole() {
	const navigate = useNavigate();
	const [appList, setAppList] = useState<AppList | null>(null);

	useEffect(() => {
		getAppList();
	}, []);

	async function getAppList() {
		const token = AuthService.getToken();
		if (token) {
			try {
				const response = await vaultSDK.getAppList(token);
				setAppList(response);
			} catch (error) {}
		} else {
			// navigate to login
		}
	}

	return (
		<VaultBase focus={"developer"}>
			<Paper
				elevation={0}
				sx={{
					p: { md: 4, xs: 2 },
					mb: 2,
					display: "flex",
					justifyContent: "center",
				}}
			>
				<Grid container spacing={{ md: 4, xs: 2 }} alignItems="center">
					<Grid container item xs={6}>
						<Typography variant="h2" color="secondary" align="left">
							My Applications
						</Typography>
					</Grid>
					<Grid container item xs={6} justifyContent="right">
						<Button
							onClick={() => navigate("/developer/createApp")}
							color="primary"
							variant="contained"
							startIcon={<Add />}
							size="small"
						>
							Create
						</Button>
					</Grid>
					<Grid container item xs={12}>
						<DisplayAppList appList={appList} />
					</Grid>
					<Grid container item xs={12}>
						<Typography
							variant="subtitle1"
							align="left"
							sx={{
								pt: { md: 4, xs: 2 },
								pl: { md: 4, xs: 2 },
							}}
						></Typography>
					</Grid>
					<Grid container item xs={12}>
					</Grid>
				</Grid>
			</Paper>
		</VaultBase>
	);
}
