import React, { useEffect, useState } from "react";
import { AuthService } from "../../services/auth";
import { useNavigate, useParams } from "react-router-dom";
import { Message, MessagingService } from "../../services/messaging";
import { EnableOpts, EnableResult } from "../../lib/common/api";
import vaultSDK from "../../lib/VaultSDK";
import { AccountList, Genesis } from "../../lib/VaultSDK/vault/algo";
import { ThemeProvider } from "@emotion/react";
import VaultLogo from "../../assets/logo_light.svg";
import styles from "../../styles/common.module.css";
import {
	Container,
	AppBar,
	Toolbar,
	Typography,
	createTheme,
	Alert,
	Checkbox,
	FormControlLabel,
	Button,
	AlertColor,
	Link,
	Box,
	Stack,
} from "@mui/material";
import { DisplayMessage } from "../../lib/common/message";
import ParseUtil from "../../lib/util/parse";
import { render } from "@testing-library/react";
import EncodingUtil from "../../lib/util/encoding";

interface WalletEnableSession {
	network: string;
	origin: string;
	requestId: number;
}

const theme = createTheme();
const mService = new MessagingService(window.opener);
let input: boolean = false;
let wSession : WalletEnableSession | null = null;

export default function WalletEnable() {
	const params = useParams();
	const navigate = useNavigate();
	const [enable, setEnable] = useState<WalletEnableSession | null>(null);
	const [accountList, setAccountList] = useState<AccountList | null>(null);
	const [selectedAccountList, setSelectedAccountList] = useState<string[]>(
		[]
	);
	const [displayMessage, setDisplayMessage] = useState<DisplayMessage | null>(
		null
	);
	useEffect(() => {

		let target = window.opener;
		if (target != null) {
			mService.onMessage((msg, origin) => onMessageHandle(msg, origin));
			/*
			window.addEventListener("unload", (ev) => {
				ev.preventDefault();
				MessagingService.sendMessage(target, {
					channel: MessagingService.channel,
					message: "window-closed",
				});
			});
			*/
			//MessagingService.windowLoadConfirmation(target);
			checkSession();
		} else {
			setDisplayMessage({ text: "Missing dApp origin", type: "error" });
			//navigate("/login");
		}
	}, []);
	// check if user logged in
	// if not redirect to logi await new Promise(resolve => setTimeout(resolve, 1000));n
	async function checkSession() {
		let sessionParam = params["data"];
		if (sessionParam == null) {
			await waitForEnableInput();
		} else {
			wSession = JSON.parse(EncodingUtil.decodeString(sessionParam));
			setEnable(wSession);
			mService.id = wSession!.requestId;
		}
		const auth = AuthService.isLoggedIn();
		if (!auth) {

			let sessionString =JSON.stringify(wSession);
			// create session 
			let redirect_url = "/login?redirect_url=" + encodeURIComponent("/api/enable/")+EncodingUtil.encodeString(sessionString);
			if (!AuthService.hasAccount()){
				redirect_url = "/register?redirect_url=" + encodeURIComponent("/api/enable/")+EncodingUtil.encodeString(sessionString);
			}
			navigate(redirect_url);
		}

		// check if enableSession
		//if (sessionStorage.getItem("enableSession") != null) {
		if (wSession != null) {
			getAccountList();
		} else {
			setDisplayMessage({
				text: "Missing request parameter",
				type: "error",
			});
		}
	}
	function onMessageHandle(msg: Message, origin: string) {
		try {
			mService.origin = origin;
			mService.id = msg.id;
			let enable: EnableOpts = JSON.parse(msg.data);
			// validate enable
			if (enable.network == null && enable.genesisHash == null) {
				setDisplayMessage({
					text: "Require network type",
					type: "error",
				});
			} else {
				let enableSession: WalletEnableSession = {
					network: enable.network || "",
					origin: origin,
					requestId: msg.id,
				};
				sessionStorage.setItem(
					"enableSession",
					JSON.stringify(enableSession)
				);
				setEnable(enableSession);
				input = true;
				wSession = enableSession;
			}
		} catch (error) {
			console.log(error);
		}
	}

	/*
	const retries = 10;
	async function waitForEnableInput() {
		for (let i = 0; i < retries; i++) {
			if (enable == null) {
				await new Promise((resolve) => setTimeout(resolve, 100));
			} else {
				return;
			}
		}
	}*/

	const INTERVAL = 100;
	const TIMEOUT = 10000;
	async function waitForEnableInput(): Promise<boolean> {
		let wait = TIMEOUT;
		while (wait > 0) {
			if (input == false) {
				await new Promise((resolve) => setTimeout(resolve, INTERVAL));
			} else {
				return Promise.resolve(true);
			}
			wait = wait - INTERVAL;
		}
		return Promise.resolve(false);
	}

	async function getAccountList() {
		const token = AuthService.getToken();
		if (token) {
			const accountList = await vaultSDK.getAccountList(token);
			console.log(accountList);
			setAccountList(accountList);
		} else {
		}
	}

	function accountSelection(event: React.ChangeEvent<HTMLInputElement>) {
		setSelectedAccountList(
			updateStringArray(selectedAccountList, event.target.value)
		);
	}

	function updateStringArray(array: string[], id: string): string[] {
		let modifiedArray: string[] = [];
		let found = false;
		for (let value of array) {
			if (value != id) {
				modifiedArray.push(value);
			} else {
				found = true;
			}
		}
		if (found == false) {
			modifiedArray.push(id);
		}
		return modifiedArray;
	}

	async function handleEnable() {
		const token = AuthService.getToken();
		if (token) {
			try {
				console.log("id " + mService.id);
				let result: Genesis = await vaultSDK.enable(
					token,
					selectedAccountList,
					enable?.origin || "",
					enable?.network || ""
				);
				// clear old error message
				if (result) {
					let enableResult: EnableResult = {
						accounts: selectedAccountList,
						genesisID: result.id,
						genesisHash: result.hash,
					};
					mService.sendMessageText(JSON.stringify(enableResult));
					setDisplayMessage({
						text: "Account enable successful!!",
						type: "info",
					});
					window.close();
				} else {
					mService.sendErrorMessage("account enable failed");
					setDisplayMessage({
						text: "Account enable failed!!",
						type: "error",
					});
				}
			} catch (error) {
				mService.sendErrorMessage((error as Error).message);
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
			mService.sendErrorMessage("account enable failed");
			return;
		}
	}

	async function handleCancel() {
		mService.sendErrorMessage("user cancel");
		window.close();
	}

	return (
		<ThemeProvider theme={theme}>
			<Container component="main">
				<Box sx={{ m: 4 }}>
					<img src={VaultLogo} width="160" height="30" />
				</Box>
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

				<Typography sx={{ m: 1 }} variant="subtitle1">
					Request came from <Link>{enable?.origin}</Link> app <br />
				</Typography>
				<Typography
					sx={{ m: 1 }}
					variant="body2"
					color="text.secondary"
				>
					Origin network: {enable?.network} <br />
				</Typography>

				{accountList?.accounts?.map((account) => (
					<Box>
						<FormControlLabel
							sx={{ width: "80%", m: 1 }}
							className={styles.formControl}
							label={EnableLabel(
								account.alias,
								account.address,
								account.iat
							)}
							control={
								<Checkbox
									id={account.address}
									value={account.address}
									onChange={accountSelection}
								/>
							}
						/>
					</Box>
				))}

				<Button
					fullWidth
					variant="contained"
					onClick={handleEnable}
					sx={{ mt: 1, mb: 1 }}
				>
					Allow
				</Button>
				<Button
					fullWidth
					variant="outlined"
					onClick={handleCancel}
					sx={{ mt: 1, mb: 1 }}
				>
					Cancel
				</Button>
			</Container>
		</ThemeProvider>
	);
}

function EnableLabel(alias: string, address: string, date: string) {
	return (
		<Stack sx={{ justifyContent: "flex-start" }}>
			<Typography align="left" variant="subtitle1">
				{alias}
			</Typography>
			<Typography align="left" variant="body2">
				{ParseUtil.displayLongAddress(address)}
			</Typography>
			<Typography align="left" variant="caption">
				{ParseUtil.parseDateTime(date)}
			</Typography>
		</Stack>
	);
}
