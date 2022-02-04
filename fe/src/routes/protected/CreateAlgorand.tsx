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
	CardContent,
	CardHeader,
	Checkbox,
	Container,
	CssBaseline,
	Dialog,
	DialogActions,
	DialogContent,
	DialogContentText,
	DialogTitle,
	FormControl,
	FormControlLabel,
	Grid,
	IconButton,
	InputLabel,
	Link,
	MenuItem,
	Paper,
	Select,
	SelectChangeEvent,
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
import { Home, ArrowBack } from "@mui/icons-material";
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
import { AlgoAccountCreationRequest,  ContractAccount } from "../../lib/VaultSDK/vault/algo";

const theme = createTheme();

function CreateAlgorand() {
	const navigate = useNavigate();

	const [script, setScript] = useState<ContractAccount | null>(null);
	const [credentials, setCredentials] = useState<Credentials | null>(null);
	const [recoveryList, setRecoveryList] = useState<RecoveryList | null>(null);
	const [formRecovery, setFormRecovery] = useState<string>("");
	const [formCredentialList, setFormCredentialList] = useState<string[]>([]);
	const [username, setUsername] = useState(AuthService.getUsername());
	const [errorMessage, setErrorMessage] = useState("");
	const [aliasName, setAliasName] = useState("");
	useEffect(() => {
		retrieveCredentials();
		retrieveRecoveryList();
	}, []);

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


	async function handleAccountCreation() {
		if(aliasName.length <=0 ){
			setErrorMessage("Alias is empty");
			return;
		}
		if(formCredentialList.length <=0 ){
			setErrorMessage("Must have atleast one credential");
			return;
		}
		if(formRecovery.length <=0) {
			setErrorMessage("Recovery is required");
			return;
		}

		if(script?.address == null) {
			setErrorMessage("Missing address for preview script");
			return;
		}

		let request : AlgoAccountCreationRequest = {
			verify_address: script?.address ,
			credential_list: formCredentialList,
			recovery: formRecovery,
		}

		const token = AuthService.getToken();
		if (token) {
			try {
				const response = await vaultSDK.createAccount(token, request);
			} catch (error){
				setErrorMessage((error as Error).message);
			}
		} else {
			setErrorMessage("missing auth token - retry login");
			return;
		}

	}

	const handleRecoveryChange = (event: SelectChangeEvent) => {
		setFormRecovery(event.target.value);
		generateScript(formCredentialList, event.target.value);
	};

	const handleCredentialChangleMultiple = (
		event: React.ChangeEvent<HTMLSelectElement>
	) => {
		const { options } = event.target;
		const value: string[] = [];
		for (let i = 0, l = options.length; i < l; i += 1) {
			if (options[i].selected) {
				value.push(options[i].value);
			}
		}
		setFormCredentialList(value);
		generateScript(value, formRecovery);
	};

	async function generateScript(credentialList: string[], recovery: string) {
		const token = AuthService.getToken();
		if (token) {
			try {
				const script = await vaultSDK.generateScript(
					token,
					credentialList,
					recovery
				);
				setScript(script);
			} catch (error){
				setErrorMessage((error as Error).message);
			}
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
							onClick={() => navigate("/manage_algorand")}
						>
							<ArrowBack />
						</IconButton>
						<Typography
							variant="h6"
							color="inherit"
							component="div"
						>
							Create Algorand Account
						</Typography>
					</Toolbar>
				</AppBar>
				{errorMessage.length > 0 &&
				<Alert severity="error" sx={{mt: 4}}>{errorMessage}</Alert>
				}
				<TextField
					id="outlined-name"
					label="Account Alias"
					name="alias"
					sx={{ mt: 4 }}
					onChange={e => setAliasName(e.target.value)}
					fullWidth
				/>
				<FormControl fullWidth sx={{ mt: 2 }}>
					<InputLabel shrink htmlFor="select-multiple-native">
						Select Credentials
					</InputLabel>
					<Select
						multiple
						native
						value={formCredentialList}
						// @ts-ignore Typings are not considering `native`
						onChange={handleCredentialChangleMultiple}
						label="Select Credentials"
						inputProps={{
							id: "select-multiple-native",
						}}
					>
						{credentials?.credentials.map((credential) => (
							<option
								key={credential.public_key}
								value={credential.public_key}
							>
								{credential.name}
							</option>
						))}
					</Select>
				</FormControl>
				<FormControl fullWidth sx={{ mt: 2 }}>
					<InputLabel id="demo-simple-select-label">
						Select Recovery
					</InputLabel>
					<Select
						labelId="demo-simple-select-label"
						id="demo-simple-select"
						value={formRecovery}
						label="Select Recovery"
						onChange={handleRecoveryChange}
					>
						{recoveryList?.recovery.map((recovery) => (
							<MenuItem value={recovery.public_key}>
								{recovery.public_key}
							</MenuItem>
						))}
					</Select>
				</FormControl>
				<Button onClick={handleAccountCreation}>Create</Button>

				<Card sx={{ mt: 2, overflow: "auto" }}>
					<CardHeader
						title="Preview for Contract Account Address: "
						subheader={script?.address}
						titleTypographyProps={{
							align: "left",
							variant: "body1",
						}}
						subheaderTypographyProps={{
							variant: "caption",
							fontSize: 10,
						}}
					></CardHeader>

					<CardContent>
						<Typography
							variant="body2"
							color="text.secondary"
							align="left"
							sx={{ whiteSpace: "pre-line" }}
						>
							{script?.teal_script}
						</Typography>
					</CardContent>
				</Card>
			</Container>
		</ThemeProvider>
	);
}

export default CreateAlgorand;
