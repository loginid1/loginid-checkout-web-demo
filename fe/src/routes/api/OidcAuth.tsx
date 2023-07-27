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
import FingerprintIcon from "@mui/icons-material/Fingerprint";
import styles from "../../styles/common.module.css";
import jwt_decode from "jwt-decode";
import AccountIcon from "@mui/icons-material/AccountCircle";
import background from "../../assets/background.svg";
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
export default function OidcAuth() {
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
	const [callback, setCallback] = useState<string>("");

	useEffect(() => {
		const sId = params["session"];
		if (sId != null) {
			vaultSDK
				.getSession(sId)
				.then((response) => {
					setPage(AuthPage.LOGIN);
					setAppOrigin(response.origin);
					clearAlert();
					setSessionId(response.id);
					setSessionInit(response);
					setCallback(response.callback);
				})
				.catch((error) => {
					setGlobalError("Invalid session");
					setPage(AuthPage.ERROR);
				});
		} else {
			setGlobalError("Session not found");
			setPage(AuthPage.ERROR);
		}
	}, []);


	function clearAlert() {
		setWaitingIndicator(false);
		setWaitingMessage(null);
		setDisplayMessage(null);
	}


	async function fidoRegister() {

		try {
			const response = await vaultSDK.federated_register(
				username,
				token,
				sessionId
			);

			AuthService.storeSession({
				username: username,
				token: response.jwt,
			});
			//navigate("/quick_add_algorand");
			//handleAccountCreation();
			AuthService.storePref({ username: username });
			setPage(AuthPage.CONSENT);
		} catch (error) {
			setDisplayMessage({
				text: (error as Error).message,
				type: "error",
			});
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

	async function handleSuccess(consent: SaveConsentResponse) {
		//postMessageText(JSON.stringify({ token: consent.token }));
		//setPage(AuthPage.FINAL);

		// need to redirect user back
		if (consent.oidc) {
			window.location.href = `${consent.oidc?.redirect_uri}#code=${consent.oidc.code}&state=${consent.oidc.state}`;
		}
	}
	async function handleCancel() {
		//mService.sendErrorMessage("user cancel");
		window.location.href = `${callback}#error=user_cancel&error_description=user_cancel`;
		//window.close();
		// need to redirect user back
	}

	return (
		<ThemeProvider theme={LoginID}>
			<CssBaseline />
			<Container
				component="main"
				maxWidth={false}
				sx={{
					display: "flex",
					justifyContent: "center",
					alignItems: "center",
					backgroundImage: `url(${background})`,
					height: `${window.innerHeight}px`,
				}}
			>
				<Paper
					elevation={0}
					sx={{
						p: { md: 6, xs: 2 },
						borderRadius: "2%",
					}}
				>
					{waitingIndicator && <LinearProgress />}
					<Stack
						spacing={0}
						sx={{
							display: "flex",
							flexDirection: "column",
							justifyContent: "center",
							alignItems: "center",
						}}
					>

					{/* 
				<Box sx={{ m: 2 }}>
					<img src={VaultLogo} width="160" height="30" />
				</Box>
				*/}

					{page === AuthPage.ERROR && (
						<ErrorPage error={globalError} />
					)}
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
					<Stack direction="row">

					<Link
						onClick={handleCancel}
						href="#"
						sx={{ m: 1 }}
						variant="caption"
						color="text.secondary"
					>
						Return to app
					</Link>
					<Link
						target="_blank"
						href="/faq"
						sx={{ m: 1 }}
						variant="caption"
						color="text.secondary"
					>
						Learn more
					</Link>
					</Stack>
					</Stack>
				</Paper>
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
