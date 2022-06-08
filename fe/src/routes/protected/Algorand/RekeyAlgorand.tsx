import React, { useEffect, useState } from "react";

import { useNavigate, useParams } from "react-router-dom";
import { alpha, createTheme, ThemeProvider } from "@mui/material/styles";
import { ReactComponent as AlgorandLogo } from "../../../assets/AlgorandLogo.svg";
import {
	Alert,
	AlertColor,
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
	Radio,
	Select,
	SelectChangeEvent,
	Stack,
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
import vaultSDK from "../../../lib/VaultSDK";
import { AuthService } from "../../../services/auth";
import {
	Credentials,
	Profile,
	Recovery,
	RecoveryList,
	RecoveryPhrase,
} from "../../../lib/VaultSDK/vault/user";
import {
	Account,
	AlgoAccountCreationRequest,
	ContractAccount,
} from "../../../lib/VaultSDK/vault/algo";
import { DisplayMessage } from "../../../lib/common/message";
import { CredentialCards } from "../../../components/CredentialCard";
import { RecoveryCard } from "../../../components/RecoveryCard";
import { VaultBase } from "../../../components/VaultBase";
import { ArrayUtil } from "../../../lib/util/array";
import ParseUtil from "../../../lib/util/parse";

const theme = createTheme();
const normalColor = "#F2F2F2A0";
const addColor = "#c8e6c9A0";
const removeColor = "#ffcdd2A0";

export function RekeyAlgorand() {
	const params = useParams();
	const navigate = useNavigate();
	const [account, setAccount] = useState<Account | null>(null);
	const [credentials, setCredentials] = useState<Credentials | null>(null);
	const [recoveryList, setRecoveryList] = useState<RecoveryList | null>(null);
	const [formRecovery, setFormRecovery] = useState<string>("");
	const [formCredentialList, setFormCredentialList] = useState<string[]>([]);
	const [formCredIDList, setFormCredIDList] = useState<string[]>([]);
	const [credentialColors, setCredentialColors] = useState<Map<string,string>>(new Map<string,string>());
	const [recoveryColors, setRecoveryColors] = useState<Map<string,string>>(new Map<string,string>());
	const [displayMessage, setDisplayMessage] = useState<DisplayMessage | null>(
		null
	);
	useEffect(() => {
		const fetchData = async () => {
			let address = params["address"];
			if (address != null) {
				const myAccount = await retrieveAccount(address);
				if (myAccount != null) {
					retrieveCredentials(myAccount);
					retrieveRecoveryList();
				}
			}
		};
		fetchData();
	}, []);

	async function retrieveAccount(address: string): Promise<Account | null> {
		const token = AuthService.getToken();
		if (token) {
			const myAccount = await vaultSDK.getAccount(token, address);
			setAccount(myAccount);
			setFormRecovery(myAccount.recovery_address);
			return myAccount;
		}
		return null;
	}
	async function retrieveCredentials(myAccount: Account) {
		const token = AuthService.getToken();
		if (token) {
			const myCredentials = await vaultSDK.getCredentials(token);
			setCredentials(myCredentials);

			let defaultCredential: string[] = [];
			let credColors = new Map<string,string>();
			// set default
			for (let cred of myCredentials.credentials) {
				/*
				if(ArrayUtil.contains(cred.public_key, myAccount.credentials_pk)){
					defaultCredential.push(cred.id);
				}
				*/
				console.log(myAccount);
				if (myAccount.credentials_id.includes(cred.id)) {
					defaultCredential.push(cred.id);
				}
				credColors.set(cred.id,normalColor);
			}
			setCredentialColors(credColors);
			setFormCredIDList(defaultCredential);
		} else {
		}
	}

	async function retrieveRecoveryList() {
		const token = AuthService.getToken();
		if (token) {
			const recoveryList = await vaultSDK.getRecoveryList(token);
			let reColors = new Map<string,string>();
			setRecoveryList(recoveryList);
			for (let recovery of recoveryList.recovery){
				reColors.set(recovery.public_key, normalColor);
			}
			setRecoveryColors(reColors);
		} else {
		}
	}

	async function handleRekey() {
		if (formCredIDList.length <= 0) {
			setDisplayMessage({
				text: "Must have atleast one credential",
				type: "error",
			});
			return;
		}
		if (formRecovery.length <= 0) {
			setDisplayMessage({ text: "Recovery is required", type: "error" });
			return;
		}

		const token = AuthService.getToken();
		if (token) {
			try {
				const response = await vaultSDK.rekeyConfirmation(
					token,
					account!.address,
					formCredIDList,
					formRecovery
				);

				// clear old error message
				setDisplayMessage({
					text: "Account rekey successful!!",
					type: "info",
				});
			} catch (error) {
				setDisplayMessage({
					text: (error as Error).message,
					type: "error",
				});
			}
		} else {
			setDisplayMessage({
				text: "missing auth token - retry login",
				type: "error",
			});
			return;
		}
	}


	const handleChangeCredential = (
		id: string,
		key: string,
		isClicked: boolean
	) => {
		let oldList = formCredIDList;
		if (isClicked) {
			oldList.push(id);
			setFormCredIDList(oldList);
			//setFormCredIDList((oldList) => [...oldList, id]);
			setFormCredentialList((oldList) => [...oldList, key]);
		} else {
			//setFormCredIDList(formCredIDList.filter((item) => item !== id));
			oldList = oldList.filter((item) => item !== id);
			setFormCredIDList(oldList);
			setFormCredentialList(
				formCredentialList.filter((item) => item !== key)
			);
		}

		let newColors = credentialColors;

		newColors.forEach((value:string, key: string)=> {
			let ccolor = false;
			let dcolor = false;
			newColors.set(key,normalColor);
			if(oldList.includes(key)) {
				ccolor = true;
			}
			if(account?.credentials_id.includes(key)) {
				dcolor = true;
			}
			if(dcolor === true && ccolor === false) {
				newColors.set(key, removeColor);
			}

			if(dcolor === false && ccolor === true) {
				newColors.set(key, addColor);
			}	
		});
		setCredentialColors(newColors);
	};

	const handleChangeRecovery = (recoveryPK: string) => {
		setFormRecovery(recoveryPK);
		let newColors = recoveryColors;
		newColors.forEach((value: string, key: string)=> {
			newColors.set(key,normalColor);	
		});
		if (recoveryPK !== account?.recovery_address){
			newColors.set(recoveryPK, addColor);
			newColors.set(account!.recovery_address, removeColor);
		}
		setRecoveryColors(newColors);
		
	};

	/*
	async function generateScript(credentialList: string[], recovery: string) {
		if(credentialList.length <=0 ){
			setDisplayMessage({text:"To preview account - must have atleast one credential", type:"error"});
			return;
		}
		if(recovery.length <=0) {
			setDisplayMessage({text:"To preview account - choose a recovery", type:"error"});
			return;
		}
		const token = AuthService.getToken();
		if (token) {
			try {
				const script = await vaultSDK.generateScript(
					token,
					credentialList,
					recovery
				);
				setScript(script);
				setDisplayMessage(null);
			} catch (error){
				setDisplayMessage({text:(error as Error).message,type:"error"});
			}
		} else {
		}
	}
	*/

	function handleLogout(e: React.MouseEvent) {
		AuthService.logout();
		navigate("/login");
	}

	return (
		<VaultBase focus={1}>
			<Paper
				elevation={0}
				sx={{
					p: { md: 4, xs: 2 },
					mb: 2,
					display: "flex",
					justifyContent: "center",
				}}
			>
				<Stack
					spacing={{ md: 4, xs: 2 }}
					sx={{ width: "100%", maxWidth: "100%" }}
					alignItems="center"
				>
					<Stack spacing={2} alignItems="center">
						<AlgorandLogo />
						<Typography variant="h2" color="secondary">
							Rekey Algorand Account
						</Typography>
					</Stack>
					{displayMessage && (
						<Alert
							severity={
								(displayMessage?.type as AlertColor) || "info"
							}
							sx={{ mt: 4 }}
						>
							{displayMessage.text}
						</Alert>
					)}

					{account && (
						<>
							<Stack spacing={2} alignItems="center">
								<Typography
									variant="subtitle2"
									color="primary"
								>
									{account.alias} -{" "}
									{ParseUtil.displayLongAddress(
										account.address
									)}
								</Typography>
							</Stack>
							<Grid
								container
								spacing={2}
								sx={{
									maxWidth: { xs: "400px", md: "50vw" },
									alignItems: "center",
									justifyContent: "center",
								}}
							>
								<Grid item xs={12}>
									{" "}
									<Typography variant="h3">
										Select your credential
									</Typography>
								</Grid>
								{credentials?.credentials?.map((credential) => (
									<Grid item xs={12} sm={12} md={6}>
										<Card
											key={credential.id}
											variant="outlined"
											sx={{
												backgroundColor: credentialColors.get(credential.id)
											}}
											elevation={0}
										>
											<CardContent>
												<Stack
													spacing={2}
													alignItems="start"
													direction="row"
												>
													<Checkbox
														checked={
															!!formCredIDList.includes(
																credential.id
															)
														}
														onChange={(e) =>
															handleChangeCredential(
																credential.id,
																credential.public_key,
																e.target.checked
															)
														}
													></Checkbox>
													<CredentialCards
														credential={credential}
													></CredentialCards>
												</Stack>
											</CardContent>
										</Card>
									</Grid>
								))}
							</Grid>

							<Grid
								container
								spacing={2}
								sx={{
									maxWidth: { xs: "400px", md: "50vw" },
									alignItems: "center",
									justifyContent: "center",
								}}
							>
								<Grid item xs={12}>
									<Typography variant="h3">
										Select your recovery option
									</Typography>
								</Grid>
								{recoveryList?.recovery.map((recovery) => (
									<Grid item xs={12} sm={12} md={6}>
										<Card
											key={recovery.id}
											variant="outlined"
											sx={{
												display: "flex",
												justifyContent: "flex-start",
												alignItems: "center",
												backgroundColor: recoveryColors.get(recovery.public_key),
											}}
											elevation={0}
										>
											<CardContent>
												<Stack
													direction="row"
													justifyContent="space-between"
													alignItems="center"
												>
													<Stack
														direction="row"
														spacing={2}
													>
														<Radio
															checked={
																formRecovery ===
																recovery.public_key
															}
															onChange={() =>
																handleChangeRecovery( recovery.public_key)

															}
														/>
														<RecoveryCard
															recovery={recovery}
															showCopy={false}
														></RecoveryCard>
													</Stack>
													{/* <IconButton>
                                <Info/>
                              </IconButton> */}
												</Stack>
											</CardContent>
										</Card>
									</Grid>
								))}
							</Grid>
						</>
					)}
					<Stack direction="row" spacing={2}>
						<Button onClick={() => navigate("/algorand_accounts")}>
							<ArrowBack />
							&nbsp;Back
						</Button>

						<Button variant="contained" onClick={handleRekey}>
							Next
						</Button>
					</Stack>
				</Stack>
			</Paper>
		</VaultBase>
	);
}
