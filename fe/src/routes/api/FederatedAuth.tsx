import React, { createContext, useEffect, useState } from "react";
import { AuthService } from "../../services/auth";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Message, MessagingService } from "../../services/messaging";
import { EnableOpts, EnableResult, WalletInit } from "../../lib/common/api";
import vaultSDK from "../../lib/VaultSDK";
import { AccountList, Genesis } from "../../lib/VaultSDK/vault/algo";
import { ThemeProvider } from "@emotion/react";
import VaultLogo from "../../assets/logo_light.svg";
import EmailIcon from "@mui/icons-material/Email";
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
	ErrorPage,
	PhonePassPage,
} from "../../components/federated/Consent";
import { AuthContext, AuthPage, ConsentContext } from "../../lib/federated";
import { SessionInitResponse } from "../../lib/VaultSDK/vault/federated";
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
				`/sdk/register?username=${username}&session=${sessionId}&appOrigin=${appOrigin}&token=${token}`,
				"register",
				defaultOptions
			);
			popupW.focus();
			window.addEventListener("focus", () => {
				console.log("focus");
				if (popupW != null) {
					setTimeout(() => {
						popupW.focus();
					}, 1);
					console.log("focusW");
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
			ws = new WebSocket(wsurl + "/api/federated/email/ws/" + sessionId);
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
				`/sdk/register?username=${username}&session=${sessionId}&appOrigin=${appOrigin}`,
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

	return (
		<ThemeProvider theme={LoginID}>
			{waitingIndicator && <LinearProgress />}
			<Container component="main">
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
							postMessage,
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
							postMessageText,
							setPage,
							handleCancel,
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
							postMessageText,
							setPage,
							handleCancel,
							setDisplayMessage,
						}}
					>
						<PhonePassPage
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
				<Typography
					sx={{ m: 1 }}
					variant="body2"
					color="text.secondary"
				>
					<p>
						You have successfully confirmed your email. Press "Add
						my passkey" to register a passkey with LoginID Wallet.
					</p>
					<p>
						LoginID Wallet provides simple and secure ways to sign
						in to your apps.
					</p>
				</Typography>
				<Chip icon={<EmailIcon />} label={username}></Chip>
				<Button
					variant="contained"
					size="small"
					sx={{ mt: 3, mb: 0 }}
					onClick={fidoRegister}
				>
					Add My Passkey
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
