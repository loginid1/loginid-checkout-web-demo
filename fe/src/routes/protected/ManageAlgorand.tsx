import React, { useEffect, useState } from "react";

import { useNavigate } from "react-router-dom";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import {
	Alert,
	AppBar,
	Avatar,
	Box,
	Breadcrumbs,
	Button,
	Card,
	CardActions,
	CardContent,
	CardHeader,
	Checkbox,
	Chip,
	Container,
	CssBaseline,
	Dialog,
	DialogActions,
	DialogContent,
	DialogContentText,
	DialogTitle,
	FormControlLabel,
	Grid,
	IconButton,
	Link,
	Paper,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	TextField,
	Toolbar,
	Typography,
} from "@mui/material";
import { Home, Menu, ArrowBack } from "@mui/icons-material";
//import MenuIcon from '@mui/icons-material/Menu';
import vaultSDK from "../../lib/VaultSDK";
import { AuthService } from "../../services/auth";
import {
	Credentials,
	Profile,
	Recovery,
	RecoveryList,
	RecoveryPhrase,
} from "../../lib/VaultSDK/vault/user";
import { Account, AccountList } from "../../lib/VaultSDK/vault/algo";
import { profile } from "console";

const theme = createTheme();

function ManageAlgorand() {
	const navigate = useNavigate();

	const [accountList, setAccountList] = useState<AccountList | null>(null);
	const [username, setUsername] = useState(AuthService.getUsername());
	const [errorMessage, setErrorMessage] = useState("");
	useEffect(() => {
		getAccountList();
	}, []);

	async function getAccountList() {
		const token = AuthService.getToken();
		if (token) {
			const accountList = await vaultSDK.getAccountList(token);
			console.log(accountList);
			setAccountList(accountList);
		} else {
		}
	}

	function handleLogout(e: React.MouseEvent) {
		AuthService.logout();
		navigate("/login");
	}

	return (
		<ThemeProvider theme={theme}>
			<Container component="main" maxWidth="xs">
				<AppBar position="static">
					<Toolbar variant="dense">
						<IconButton
							edge="start"
							color="inherit"
							aria-label="menu"
							sx={{ mr: 2 }}
							onClick={() => navigate("/home")}
						>
							<Home />
						</IconButton>
						<Typography
							variant="h6"
							color="inherit"
							component="div"
						>
							Manage Algorand Account
						</Typography>
					</Toolbar>
				</AppBar>
				{accountList == null && <p>You have no account setup yet!</p>}

				{accountList?.accounts?.map((account) => (
					<Card sx={{ mt: 2, overflow: "auto" }}>
						<CardHeader
							title="Contract Account Address: "
							subheader={account.address}
							titleTypographyProps={{
								align: "left",
								variant: "body1",
							}}
							subheaderTypographyProps={{
								variant: "caption",
								fontSize: 9,
							}}
						></CardHeader>
						<CardContent>
							<Typography
								variant="body2"
								color="text.primary"
								align="left"
							>
								Credentials:
							</Typography>
							{account?.credentials_name?.map((cred_name) => (
								<Chip label={cred_name} />
							))}
							<Typography
								variant="body2"
								color="text.primary"
								align="left"
							>
								Recovery:
							</Typography>
							<Chip label={account?.recovery_address} />
						</CardContent>
						{account?.status == "new" && (
							<CardActions>
								<Button size="small">Activate</Button>
								<Button size="small">Info</Button>
							</CardActions>
						)}
						{account?.status == "active" && (
							<CardActions>
								<Button size="small">Rekey</Button>
								<Button size="small">Info</Button>
							</CardActions>
						)}
						{account?.status == "rekey" && (
							<CardActions>
								<Button size="small">Info</Button>
							</CardActions>
						)}
					</Card>
				))}
				<Button onClick={() => navigate("/create_algorand")}>
					Create New Account
				</Button>
			</Container>
		</ThemeProvider>
	);
}

export default ManageAlgorand;
