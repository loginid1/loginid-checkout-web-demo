/*
 *   Copyright (c) 2024 LoginID Inc
 *   All rights reserved.

 *   Licensed under the Apache License, Version 2.0 (the "License");
 *   you may not use this file except in compliance with the License.
 *   You may obtain a copy of the License at

 *   http://www.apache.org/licenses/LICENSE-2.0

 *   Unless required by applicable law or agreed to in writing, software
 *   distributed under the License is distributed on an "AS IS" BASIS,
 *   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *   See the License for the specific language governing permissions and
 *   limitations under the License.
 */

import React, { createContext, useEffect, useState } from "react";
import { AuthService } from "../../services/auth";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Message, MessagingService } from "../../services/messaging";
import { EnableOpts, EnableResult, WalletInit } from "../../lib/common/api";
import vaultSDK from "../../lib/VaultSDK";
import { AccountList, Genesis } from "../../lib/VaultSDK/vault/algo";
import { ThemeProvider } from "@emotion/react";
import EmailIcon from "@mui/icons-material/Email";
import FingerprintIcon from "@mui/icons-material/Fingerprint";
import styles from "../../styles/common.module.css";
import jwt_decode from "jwt-decode";
import AccountIcon from "@mui/icons-material/AccountCircle";
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
	CssBaseline,
	Paper,
	TextField,
	CircularProgress,
	Chip,
	LinearProgress,
	Divider,
} from "@mui/material";
import { DisplayMessage } from "../../lib/common/message";
import ParseUtil from "../../lib/util/parse";
import { render } from "@testing-library/react";
import EncodingUtil from "../../lib/util/encoding";
import { LoginID } from "../../theme/theme";
import { openPopup } from "../../lib/VaultSDK/sendwyre/popup";
import { defaultOptions } from "../../lib/popup/popup";
import { CodeInput } from "../../components/CodeInput";
import { EmailDialog } from "../../components/dialogs/EmailDialog";
import LoginIDLogo from "../../assets/sidemenu/LoginIDLogo.svg";
import {
	Consent,
	DriverLicensePassPage,
	ErrorPage,
	PhonePassPage,
} from "../../components/federated/Consent";
import { AuthContext, AuthPage, ConsentContext } from "../../lib/federated";
import {
	ConsentResponse,
	SaveConsentResponse,
	SessionInitResponse,
} from "../../lib/VaultSDK/vault/federated";
import { LoginPage } from "../../components/federated/Auth";

interface WalletLoginSession {
	network: string;
	origin: string;
	requestId: number;
}

let wsurl = process.env.REACT_APP_VAULT_WS_URL || "ws://localhost:3001";
let input: boolean = false;
let wSession: WalletLoginSession | null = null;
let ws: WebSocket | null = null;
const mService = new MessagingService(window.parent);
export default function FederatedAuth() {
	const [searchParams, setSearchParams] = useSearchParams();

	const [waitingIndicator, setWaitingIndicator] = useState<boolean>(true);
	const [showRegister, setShowRegister] = useState<boolean>(false);
	const [username, setUsername] = useState("");
	const [waitingMessage, setWaitingMessage] = useState<string | null>(null);
	const [codeInput, setCodeInput] = useState<boolean>(false);
	const [openEmailDialog, setOpenEmailDialog] = useState<boolean>(false);
	const [sessionId, setSessionId] = useState<string>("");
	const params = useParams();
	const navigate = useNavigate();
	const [enable, setEnable] = useState<WalletLoginSession | null>(null);
	const [displayMessage, setDisplayMessage] = useState<DisplayMessage | null>(
		null
	);
	const [appOrigin, setAppOrigin] = useState<string>("");
	const [consent, setConsent] = useState<string[] | null>(null);
	const [page, setPage] = useState<AuthPage>(AuthPage.NONE);
	const [emailType, setEmailType] = useState<string>("login");
	const [missing, setMissing] = useState<string[]>([]);
	const [globalError, setGlobalError] = useState<string>("");
	const [attributes, setAttributes] = useState<string[]>([]);
	const [token, setToken] = useState<string>("");
	const [sessionInit, setSessionInit] = useState<SessionInitResponse | null>(
		null
	);

	useEffect(() => {
		let target = window.parent;
		if (target != null) {
			mService.onMessage((msg, origin) => onMessageHandle(msg, origin));
		} else {
			setDisplayMessage({ text: "Missing dApp origin", type: "error" });
		}
	}, []);

	useEffect(() => {}, [page]);

	// handle iframe message
	function onMessageHandle(msg: Message, origin: string) {
		try {
			//mService.origin = origin;
			// validate enable
			if (msg.type === "register_cancel") {
				setWaitingMessage(null);
				setDisplayMessage({
					text: "Passkey registration cancel!",
					type: "error",
				});
			} else if (msg.type === "register_complete") {
				// consent for first time user
				// send token back
				setPage(AuthPage.CONSENT);
			} else if (msg.type === "init") {
				mService.id = msg.id;
				let api: WalletInit = JSON.parse(msg.data);
				vaultSDK.sessionInit(origin, api.api).then((response) => {
					setPage(AuthPage.LOGIN);
					setAppOrigin(origin);
					clearAlert();
					setSessionId(response.id);
					setSessionInit(response);
				});
				// check api
			}
		} catch (error) {
			console.log(error);
		}
	}

	function clearAlert() {
		setWaitingIndicator(false);
		setWaitingMessage(null);
		setDisplayMessage(null);
	}

	function postMessageText(text: string) {
		if (mService != null) {
			mService.sendMessageText(text);
		}
	}

	function postMessage(type: string, text: string) {
		if (mService != null) {
			if (type === "error") {
				mService.sendErrorMessage(text);
			} else {
				mService.sendMessageText(text);
			}
		}
	}

	async function handleLogin() {
		try {
			if (!(await vaultSDK.checkUser(username))) {
				emailRegister();
			} else {
				const response = await vaultSDK.federated_authenticate(
					username,
					sessionId
				);
				AuthService.storeSession({
					username: username,
					token: response.jwt,
				});
				setPage(AuthPage.CONSENT);
			}
		} catch (error) {
			setDisplayMessage({
				text: (error as Error).message,
				type: "error",
			});
			//setCodeInput(true);
			// show 6 digit code
			emailLogin(username);
		}
	}

	async function fidoRegister() {
		// need to handle safari blocking popup in async
		try {
			let popupW = openPopup(
				`/sdk/register?username=${encodeURIComponent(username)}&session=${encodeURIComponent(sessionId)}&appOrigin=${encodeURIComponent(appOrigin)}&token=${encodeURIComponent(token)}`,
				"register",
				defaultOptions
			);
			popupW.focus();
			window.addEventListener("focus", () => {
				if (popupW != null) {
					setTimeout(() => {
						popupW.focus();
					}, 1);
				}
			});
			setWaitingMessage("Waiting for new passkey registration ...");
			return;
		} catch (error) {
			setDisplayMessage({
				text: "user not found - use sign up for new account",
				type: "error",
			});
			setShowRegister(true);
			return;
		}
	}

	async function emailRegister() {
		try {
			await vaultSDK.sendEmailSession(
				sessionId,
				username,
				"register",
				appOrigin
			);
			//setWaitingMessage("Check email for login session")
			setWaitingIndicator(true);
			setEmailType("register");
			setOpenEmailDialog(true);
			ws = new WebSocket(wsurl + "/api/federated/email/ws/" + encodeURIComponent(sessionId));
			ws.onopen = () => {
				ws?.send(JSON.stringify({ email: username, type: "register" }));
			};
			ws.onmessage = (event) => {
				let token = event.data;
				let decoded = jwt_decode(token);
				if (decoded != null) {
					closeEmailDialog();
					//registerFido(token);
					setToken(token);
					setPage(AuthPage.FIDO_REG);
					clearAlert();
					//ws?.close();
					// register fido
				}
			};
			ws.onclose = () => {};
		} catch (error) {
			setDisplayMessage({
				type: "error",
				text: (error as Error).message,
			});
			mService.sendErrorMessage((error as Error).message);
		}
	}

	async function handleSignup() {
		try {
			openPopup(
				`/sdk/register?username=${encodeURIComponent(username)}&session=${encodeURIComponent(sessionId)}&appOrigin=${encodeURIComponent(appOrigin)}`,
				"regiser",
				defaultOptions
			);
			setWaitingMessage("Waiting for new passkey registration ...");
			return;
		} catch (error) {
			setDisplayMessage({
				text: (error as Error).message,
				type: "error",
			});
		}
	}

	async function emailLogin(email: string) {
		await vaultSDK.sendEmailSession(sessionId, email, "login", appOrigin);
		setWaitingIndicator(true);
		setOpenEmailDialog(true);
		ws = new WebSocket(wsurl + "/api/federated/email/ws/" + sessionId);
		ws.onopen = () => {
			ws?.send(JSON.stringify({ email: email, type: "login" }));
		};
		ws.onmessage = (event) => {
			let token = event.data;
			let decoded = jwt_decode(token);
			if (decoded != null) {
				setDisplayMessage({
					text: "Login completed!",
					type: "info",
				});
				closeEmailDialog();
				setPage(AuthPage.CONSENT);
				//ws?.close();
			}
		};
		ws.onclose = () => {
			// close websocket
			setWaitingMessage("");
			setDisplayMessage({
				text: "email session timeout or cancel!",
				type: "error",
			});
		};
	}

	function closeEmailDialog() {
		setWaitingIndicator(false);
		setOpenEmailDialog(false);
		if (ws != null) {
			ws.close();
		}
	}

	async function validateCode() {}

	async function handleCancel() {
		mService.sendErrorMessage("user cancel");
		//window.close();
	}

	async function handleSuccess(consent: SaveConsentResponse) {
		postMessageText(JSON.stringify({ token: consent.token }));
		setPage(AuthPage.FINAL);
	}

	return (
		<ThemeProvider theme={LoginID}>
			{waitingIndicator && <LinearProgress />}
			<Container component="main">
				{displayMessage && (
					<Alert
						severity={
							(displayMessage?.type as AlertColor) || "info"
						}
						sx={{ mt: 2 }}
					>
						{displayMessage.text}
					</Alert>
				)}
				{/* 
				<Box sx={{ m: 2 }}>
					<img src={VaultLogo} width="160" height="30" />
				</Box>
				*/}

				{page === AuthPage.ERROR && <ErrorPage error={globalError} />}
				{page === AuthPage.LOGIN && (
					<AuthContext.Provider
						value={{
							username,
							setUsername,
							setPage,
							handleCancel,
							setToken,
						}}
					>
						{sessionInit && (
							<LoginPage
								session={sessionInit}
								username={username}
							/>
						)}
					</AuthContext.Provider>
				)}
				{page === AuthPage.FIDO_REG && Fido()}
				{page === AuthPage.CONSENT && (
					<ConsentContext.Provider
						value={{
							setPage,
							handleCancel,
							handleSuccess,
							setDisplayMessage,
						}}
					>
						{/*Consent ({session:sessionId, username})*/}
						<Consent session={sessionId} username={username} />
					</ConsentContext.Provider>
				)}

				{page === AuthPage.PHONE_PASS && (
					<ConsentContext.Provider
						value={{
							setPage,
							handleCancel,
							handleSuccess,
							setDisplayMessage,
						}}
					>
						<PhonePassPage
							session={sessionId}
							username={username}
						/>
					</ConsentContext.Provider>
				)}

				{page === AuthPage.DRIVER_PASS && (
					<ConsentContext.Provider
						value={{
							setPage,
							handleCancel,
							handleSuccess,
							setDisplayMessage,
						}}
					>
						<DriverLicensePassPage
							session={sessionId}
							username={username}
						/>
					</ConsentContext.Provider>
				)}
				{page === AuthPage.FINAL && Final()}

				<Divider variant="fullWidth" />
				<Typography
					variant="caption"
					color="#1E2898"
					sx={{
						m: 1,
						position: "relative",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
					}}
				>
					powered by&nbsp;
					<img src={LoginIDLogo} alt="something" />
				</Typography>
				<Link
					target="_blank"
					href="/faq"
					sx={{ m: 1 }}
					variant="caption"
					color="text.secondary"
				>
					Learn more
				</Link>
			</Container>
		</ThemeProvider>
	);

	function Final() {
		return (
			<Stack>
				<Typography
					sx={{ m: 1 }}
					variant="body1"
					color="text.secondary"
				>
					You have successfully logged in as:
				</Typography>
				<Chip icon={<AccountIcon />} label={username}></Chip>
				<Button
					variant="text"
					size="small"
					onClick={handleCancel}
					sx={{ mt: 2, mb: 2 }}
				>
					Close
				</Button>
			</Stack>
		);
	}

	function Fido() {
		return (
			<Stack>
				<Typography
					sx={{ m: 1 }}
					variant="body2"
					color="text.secondary"
					textAlign="left"
				>
					<p>
						Register a LoginID Wallet account with biometrics you
						already use to unlock your device.
					</p>
					<p>
						LoginID Wallet provides simple and secure ways to sign
						in to your apps and manage all your identities.
					</p>
				</Typography>
				<Chip icon={<FingerprintIcon />} label={username}></Chip>
				<Button
					variant="contained"
					size="small"
					sx={{ mt: 3, mb: 0 }}
					onClick={fidoRegister}
				>
					Register with Biometrics
				</Button>
				<Button
					variant="text"
					size="small"
					onClick={handleCancel}
					sx={{ mt: 0, mb: 2 }}
				>
					Cancel
				</Button>
			</Stack>
		);
	}
}
