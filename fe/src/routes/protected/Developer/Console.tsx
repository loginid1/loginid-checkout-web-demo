import { Add } from "@mui/icons-material";
import {
	Typography,
	Button,
	Paper,
	Stack,
	CircularProgress,
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
	const [applications, setApplications] = useState<AppList | null>(null);

	useEffect(() => {
		const fetchData = async () => {
			const token = AuthService.getToken();
			if (token) {
				const result = await vaultSDK.getAppList(token);
				setApplications(result);
			}
		}

		fetchData();
	}, []);

	return (
		<VaultBase focus={"developer"}>
			<Stack 
				direction="row" 
				justifyContent="space-between"
				sx={{
					padding: { md: 4, xs: 2 },
				}}
			>
				<Typography
					variant="h2"
					color="secondary"
					align="left"
				>
					Applications
				</Typography>
				{
					(applications !== null && applications.apps.length !== 0) &&
					<Button variant="text" onClick={() => {navigate('/developer/app/create')}}>
						<Add/>
						Add a new application
					</Button>
				}
			</Stack>
			{ 
				applications === null ? 
				(
					<Stack direction="row" justifyContent="center">
						<CircularProgress />
					</Stack>
				) : (
					applications.apps.length === 0 ? 
					(
						<>
							<Typography align="center" fontSize={30} fontWeight="bold" color="rgba(0,0,0,0.5)" sx={{pb: 5, pt: 10}}>
								You don't have any application yet
							</Typography>
							<Stack direction="row" justifyContent="center" spacing={2}>
								<Button variant="text" onClick={() => {navigate('/developer/app/create')}}>
									<Add/>
									Add your first application
								</Button>
							</Stack>
						</>
					) : (
						<>
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
					)
				)
			}
		</VaultBase>
	);
}
