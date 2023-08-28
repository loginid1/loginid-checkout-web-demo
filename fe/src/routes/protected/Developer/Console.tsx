import { Add } from "@mui/icons-material";
import {
	Typography,
	Button,
	Paper,
	Stack,
	CircularProgress,
	Alert,
} from "@mui/material";
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { DisplayAppList } from "../../../components/AppList";
import { WebflowQuickIntegrationDialog } from "../../../components/dialogs/WebflowQuickIntegrationDialog";
import { VaultBase } from "../../../components/VaultBase";
import vaultSDK from "../../../lib/VaultSDK";
import { AppList } from "../../../lib/VaultSDK/vault/developer";
import { AuthService } from "../../../services/auth";

export default function DeveloperConsole() {
	const navigate = useNavigate();
	const [applications, setApplications] = useState<AppList | null>(null);
	const [searchParams, setSearchParams] = useSearchParams();
	const [openWebflow, setOpenWebflow] = useState<boolean>(false);

	useEffect(() => {
		let webflow = searchParams.get("webflow");
		if (webflow) {
			setOpenWebflow(true);
		}

		fetchData();
	}, []);

	async function fetchData() {
		const token = AuthService.getToken();
		if (token) {
			const result = await vaultSDK.getAppList(token);
			setApplications(result);
		}
	}

	return (
		<VaultBase focus={"developer"}>
			<Stack
				direction="row"
				justifyContent="space-between"
				sx={{
					padding: { md: 4, xs: 2 },
				}}
			>
				<Typography variant="h2" color="secondary" align="left">
					Applications
				</Typography>
				{applications && applications.apps.length !== 0 && (
					<>
						<Button
							variant="text"
							onClick={() => {
								navigate("/developer/app/create");
							}}
						>
							<Add />
							New application
						</Button>
					</>
				)}
			</Stack>
			{applications === null ? (
				<Stack direction="row" justifyContent="center">
					<CircularProgress />
				</Stack>
			) : applications.apps.length === 0 ? (
				<>
					<Typography
						align="center"
						fontSize={30}
						fontWeight="bold"
						color="rgba(0,0,0,0.5)"
						sx={{ pb: 5, pt: 10 }}
					>
						You don't have any application yet
					</Typography>
					<Stack direction="row" justifyContent="center" spacing={2}>
						<Button
							variant="text"
							onClick={() => {
								navigate("/developer/app/create");
							}}
						>
							<Add />
							Add your first application
						</Button>
					</Stack>
					<Alert
						severity="info"
						action={
							<Button
								size="small"
								onClick={() => setOpenWebflow(true)}
							>
								Integrate with Webflow
							</Button>
						}
						sx={{
							"& .MuiAlert-message": {
								textAlign: "left",
								width: "inherit",
							},
						}}
					>
						For Webflow developer, you can create a new integration here.
					</Alert>
				</>
			) : (
				<>
					<Alert
						severity="info"
						action={
							<Button
								size="small"
								onClick={() => setOpenWebflow(true)}
							>
								Integrate with Webflow
							</Button>
						}
						sx={{
							"& .MuiAlert-message": {
								textAlign: "left",
								width: "inherit",
							},
						}}
					>
						For Webflow developer, you can create and integrate
						here.
					</Alert>
					<Paper
						elevation={0}
						sx={{
							p: { md: 4, xs: 2 },
							mb: 2,
							display: "flex",
							justifyContent: "center",
						}}
					>
						<DisplayAppList appList={applications} />
					</Paper>
				</>
			)}

			<WebflowQuickIntegrationDialog
				appList={applications}
				open={openWebflow}
				handleClose={() => {
					setOpenWebflow(false);
					fetchData();
				}}
			></WebflowQuickIntegrationDialog>
		</VaultBase>
	);
}
