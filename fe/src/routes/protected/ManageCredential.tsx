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
	Checkbox,
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
import { Home, Menu } from "@mui/icons-material";
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

const theme = createTheme();

function ManageCredential() {
	const navigate = useNavigate();

	const [profile, setProfile] = useState<Profile | null>(null);
	const [credentials, setCredentials] = useState<Credentials | null>(null);
	const [recoveryList, setRecoveryList] = useState<RecoveryList | null>(null);
	const [recovery, setRecovery] = useState<RecoveryPhrase | null>(null);
	const [username, setUsername] = useState(AuthService.getUsername());
	const [errorMessage, setErrorMessage] = useState("");
	const [credentialCode, setCredentialCode] = useState<string | null>(null);
	useEffect(() => {
		retrieveProfile();
		retrieveCredentials();
		retrieveRecoveryList();
	}, []);

	async function retrieveProfile() {
		const token = AuthService.getToken();
		if (token) {
			const myProfile = await vaultSDK.getProfile(token);
			setProfile(myProfile);
		} else {
		}
	}

	async function retrieveCredentials() {
		const token = AuthService.getToken();
		if (token) {
			const myCredentials = await vaultSDK.getCredentials(token);
			setCredentials(myCredentials);
		} else {
		}
	}

	async function retrieveRecoveryList() {
		const token = AuthService.getToken();
		if (token) {
			const recoveryList = await vaultSDK.getRecoveryList(token);
			setRecoveryList(recoveryList);
		} else {
		}
	}

	async function createRecovery() {
		const token = AuthService.getToken();
		if (token) {
			const recovery = await vaultSDK.createRecovery(token);
			setRecovery(recovery);
			// update recoveryList
			retrieveRecoveryList();
		} else {
		}
	}

	async function generateCredentialCode() : Promise<string | null> {
		const token = AuthService.getToken();
		if (token) {
			const response = await vaultSDK.generateCredentialCode(token);
			return response.code
		}
		return null 
	}

	const [openCredential, setOpenCredential] = React.useState(false);
	const [openRecovery, setOpenRecovery] = React.useState(false);

	const handleClickOpenCredential = async () => {
		const code = await generateCredentialCode();
		if (code != null) {
			setCredentialCode(code);
			setOpenCredential(true);
		}
	};

	const handleCloseCredential = () => {
		setOpenCredential(false);
	};

	const handleClickOpenRecovery = async () => {
		await createRecovery()
		setOpenRecovery(true);
	};

	const handleCloseRecovery = () => {
		setOpenRecovery(false);
	};

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
							Manage Credential
						</Typography>
					</Toolbar>
				</AppBar>
				<TableContainer component={Paper} sx={{ mt: 2 }}>
					<Table size="small" aria-label="a dense table">
						<TableHead>
							<TableRow>
								<TableCell colSpan={3}>
									My Credentials
								</TableCell>
							</TableRow>
						</TableHead>
						<TableHead>
							<TableRow>
								<TableCell>Name</TableCell>
								<TableCell align="right">Algorithm</TableCell>
								<TableCell align="right">Time</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{credentials?.credentials.map((credential) => (
								<TableRow
									key={credential.id}
									sx={{
										"&:last-child td, &:last-child th": {
											border: 0,
										},
									}}
								>
									<TableCell component="th" scope="row">
										{credential.name}
									</TableCell>
									<TableCell align="right">
										{credential.key_alg}
									</TableCell>
									<TableCell align="right">
										{credential.iat}
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</TableContainer>
				<Button onClick={handleClickOpenCredential}>
					Device Registration Code
				</Button>

				<Dialog
					open={openCredential}
					onClose={handleCloseCredential}
					aria-labelledby="alert-dialog-title"
					aria-describedby="alert-dialog-description"
				>
					<DialogTitle id="alert-dialog-title">
						Registration Code: {credentialCode}
					</DialogTitle>
					<DialogContent>
						<DialogContentText id="alert-dialog-description">
							You have 5 minutes to use this code to register for
							new device
						</DialogContentText>
					</DialogContent>
					<DialogActions>
						<Button onClick={handleCloseCredential}>Close</Button>
					</DialogActions>
				</Dialog>

				<TableContainer component={Paper} sx={{ mt: 2 }}>
					<Table size="small" aria-label="a dense table">
						<TableHead>
							<TableRow>
								<TableCell colSpan={3}>
									My Recovery Codes
								</TableCell>
							</TableRow>
						</TableHead>
						<TableHead>
							<TableRow>
								<TableCell align="left">Public Key</TableCell>
								<TableCell align="left">Time</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{recoveryList?.recovery.map((code) => (
								<TableRow
									key={code.id}
									sx={{
										"&:last-child td, &:last-child th": {
											border: 0,
										},
									}}
								>
									<TableCell align="right">
										{code.public_key}
									</TableCell>
									<TableCell align="right">
										{code.iat}
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</TableContainer>
				<Button onClick={handleClickOpenRecovery}>
					Create Recovery Code
				</Button>
				<Dialog
					open={openRecovery}
					onClose={handleCloseRecovery}
					aria-labelledby="alert-dialog-title"
					aria-describedby="alert-dialog-description"
				>
					<DialogTitle id="alert-dialog-title">
						New Recovery Code
					</DialogTitle>
					<DialogContent>
						<Typography
							variant="body2"
							color="inherit"
							component="div"
						>
							Public Key: <strong>{recovery?.public_key} </strong>
						</Typography>
						<Alert severity="warning">Mnemonic phrases below will only display within this dialog - please securely store them!</Alert>
						<DialogContentText id="alert-dialog-description" color="primary">
							{recovery?.private_key}
						</DialogContentText>
					</DialogContent>
					<DialogActions>
						<Button onClick={handleCloseRecovery}>Close</Button>
					</DialogActions>
				</Dialog>
			</Container>
		</ThemeProvider>
	);
}

export default ManageCredential;
