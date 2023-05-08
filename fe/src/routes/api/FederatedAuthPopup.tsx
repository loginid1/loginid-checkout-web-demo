import React, { useEffect, useState } from "react";
import { AuthService } from "../../services/auth";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Message, MessagingService } from "../../services/messaging";
import { EnableOpts, EnableResult, WalletInit } from "../../lib/common/api";
import vaultSDK from "../../lib/VaultSDK";
import { AccountList, Genesis } from "../../lib/VaultSDK/vault/algo";
import { ThemeProvider } from "@emotion/react";
import VaultLogo from "../../assets/logo_light.svg";
import EmailIcon from "@mui/icons-material/Email";
import CheckIcon from "@mui/icons-material/Check";
import styles from "../../styles/common.module.css";
import jwt_decode from "jwt-decode";
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
import { Check, MessageSharp } from "@mui/icons-material";

interface WalletLoginSession {
	network: string;
	origin: string;
	requestId: number;
}


let wsurl = process.env.REACT_APP_VAULT_WS_URL || "ws://localhost:3001";
const mService = new MessagingService(window.opener);
let input: boolean = false;
let wSession: WalletLoginSession | null = null;
let ws: WebSocket | null = null;
export default function FederatedAuthPopup() {
	const [searchParams, setSearchParams] = useSearchParams();

	const [waitingIndicator, setWaitingIndicator] = useState<boolean>(true);
	const [showRegister, setShowRegister] = useState<boolean>(false);
	const [username, setUsername] = useState("");
	const [waitingMessage, setWaitingMessage] = useState<string | null>(null);
	const [codeInput, setCodeInput] = useState<boolean>(false);
	const [page, setPage] = useState<string>("");
	const [openEmailDialog, setOpenEmailDialog] = useState<boolean>(false);
	const [emailType, setEmailType] = useState<string> ("login");
	const [sessionId, setSessionId] = useState<string>("");
	const params = useParams();
	const navigate = useNavigate();
	const [enable, setEnable] = useState<WalletLoginSession | null>(null);
	const [displayMessage, setDisplayMessage] = useState<DisplayMessage | null>(null);
	const [appOrigin, setAppOrigin] = useState<string>("");
	const [appName, setAppName] = useState<string>("");
	const [consent, setConsent] = useState<string[] | null>(null);
	const [token, setToken] = useState("");

	useEffect(() => {
		// expect opener
		let target = window.opener;
		if (target != null) {
			mService.onMessage((msg, origin) => onMessageHandle(msg, origin));
		} else {
			setDisplayMessage({ text: "Missing dApp origin", type: "error" });
		}
	}, []);

	useEffect(() => {
		if (page === "consent") {
			checkConsent();
		}
	}, [page]);

	// handle iframe message
	function onMessageHandle(msg: Message, origin: string) {
		try {
			mService.origin = origin;
			mService.id = msg.id;
			// validate enable
			if (msg.type === "register_cancel") {
				setWaitingMessage(null);
				setDisplayMessage({
					text: "Registration cancel!",
					type: "error",
				});
			} else if (msg.type === "register_complete") {
				// consent for first time user
				// send token back
				setPage("consent");
				setDisplayMessage({
					text: "Registration completed!",
					type: "info",
				});
			} else if (msg.type === "init") {

				let api : WalletInit = JSON.parse(msg.data);
				vaultSDK.sessionInit(origin, api.api).then((response) => {
					setPage("login");
					setAppOrigin(origin);
					clearAlert();
					setSessionId(response.id);
					console.log("session ", response.id);
				}).catch(error =>{
					clearAlert();
					setDisplayMessage({text:(error as Error).message, type:"error"})
				});
				// check api
			}
		} catch (error) {
			console.log(error);
		}
	}

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

	function clearAlert() {
		setWaitingIndicator(false);
		setWaitingMessage(null);
		setDisplayMessage(null);
	}

	async function checkConsent() {
		try {
			let consent = await vaultSDK.checkConsent(sessionId);
			setConsent(consent.required_attributes);
			setAppName(consent.app_name);
			if (consent.required_attributes.length !== 0) {
				mService.sendMessageText(consent.token);
			}
		} catch(e) {
			setConsent(null);
			setAppName("");
		}
	}
	async function saveConsent() {
		let consent = await vaultSDK.saveConsent(sessionId);
		mService.sendMessageText(consent.token);
		setConsent(null);
		setAppName("");
	}

	async function handleLogin() {
		try {
			if (!(await vaultSDK.checkUser(username))) {

				// handle email register
				emailRegister();

			} else{

				const response = await vaultSDK.federated_authenticate(
					username,
					sessionId
				);
				setPage("consent");
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

	async function emailRegister() {
		try {
			await vaultSDK.sendEmailSession(sessionId, username, "register", appOrigin);
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
					setPage("fido");
					clearAlert();
					//ws?.close();
					// register fido
				}
			};
			ws.onclose = () => {
			};
		} catch (error) {
			setDisplayMessage({type:"error", text:(error as Error).message})
			mService.sendErrorMessage((error as Error).message);
		}
	}

	async function registerFido() {
		try {
			const response = await vaultSDK.federated_register(
				username,
				token,
				sessionId
			);
			/*
			AuthService.storeSession({
				username: username,
				token: response.jwt,
			});
			*/
			//navigate("/quick_add_algorand");
			//handleAccountCreation();
			AuthService.storePref({ username: username });
			setPage("consent");

		} catch (error) {
			setDisplayMessage({text:(error as Error).message, type:"error",});
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
		setEmailType("login");
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
				setPage("consent");
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
		window.close();
	}

	async function handleClose(){
		window.close();
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
				{displayMessage == null && (
					<Box sx={{ m: 2, height: "48px" }}></Box>
				)}

				{page === "login" && Login()}
				{page === "fido" && Fido()}
				{page === "consent" && Consent()}
				<EmailDialog
					type={emailType}
					email={username}
					session={sessionId}
					open={openEmailDialog}
					handleClose={closeEmailDialog}
				></EmailDialog>

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

	function Login() {
		return (
			<>
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
					Sign In or Sign Up
				</Typography>
				<TextField
					fullWidth
					label="Email"
					value={username}
					size="small"
					onChange={(e) => setUsername(e.target.value)}
					focused
				/>

				<Button
					fullWidth
					variant="contained"
					onClick={handleLogin}
					size="small"
					sx={{ mt: 1, mb: 1 }}
				>
					Continue
				</Button>
				{showRegister &&
				<Button
					fullWidth
					variant="text"
					onClick={handleSignup}
					size="small"
					sx={{ mt: 1, mb: 1 }}
				>
					Signup
				</Button>
				}
				<Typography
					sx={{ m: 1 }}
					variant="caption"
					color="text.secondary"
				>
					Simple passwordless login with passkey or email
				</Typography>
				{codeInput && (
					<Stack spacing={2}>
						<Typography variant="caption" maxWidth="400px">
							Please enter the 6-digit code from your email to
							login.
						</Typography>
						<CodeInput
							inputName="code"
							validateCode={validateCode}
						/>
					</Stack>
				)}
				{waitingMessage && (
					<Stack direction="row" alignItems="center">
						<CircularProgress size="2rem" />
						<Typography variant="caption">
							{waitingMessage}
						</Typography>
					</Stack>
				)}
			</>
		);
	}

	function Consent() {
		return (
			<Stack>
				<Typography
					sx={{ m: 1 }}
					variant="body2"
					color="text.secondary"
				>
					You have successfully logged in as:
				</Typography>
				<Chip icon={<EmailIcon />} label={username}></Chip>
				{consent && (
					<>
						<Typography
							sx={{ m: 1 }}
							variant="body2"
							color="text.secondary"
						>
							Do you consent on sharing the following information with <strong>{ appName }</strong>:
						</Typography>
						<Stack direction="row" justifyContent="center" spacing={2} >
							{consent?.map((item) => (
								<Chip size="small" icon={<CheckIcon/>} label={item}/>
							))}
						</Stack>
						<Button
							fullWidth
							variant="contained"
							onClick={saveConsent}
							size="small"
							sx={{ mt: 2, mb: 1 }}
						>
							Allow
						</Button>
					</>
				)}
				<Button
					variant="text"
					size="small"
					onClick={handleClose}
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
					You have successfully confirmed your email. Press "Add my
					passkey" to complete this registration:
				</Typography>
				<Chip icon={<EmailIcon />} label={username}></Chip>
				<Button
					variant="contained"
					size="small"
					sx={{ mt: 3, mb: 0 }}
					onClick={registerFido}
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

/*
function Lgin(){
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
			  <Stack
				component="form"
				onSubmit={handleSubmit}
				spacing={2}
				sx={{
				  display: "flex",
				  flexDirection: "column",
				  justifyContent: "center",
				  alignItems: "center",
				}}
			  >
				<VaultLogo />
				<Typography variant="body1" marginTop={2}>
				  Log in securely to your FIDO Vault Account.
				</Typography>
				{errorMessage.length > 0 && (
				  <Alert severity="error">{errorMessage}</Alert>
				)}
				<TextField
				  fullWidth
				  label="Username"
				  value={username}
				  onChange={(e) => setUsername(e.target.value)}
				  focused
				/>
				<Button
				  type="submit"
				  variant="contained"
				  size="large"
				  sx={{ mt: 4, mb: 2 }}
				>
				  Login
				</Button>
				<Typography variant="body1">
				  Don't have an account yet?{" "}
				  <Link href={redirect_url?"./register?redirect_url="+redirect_url:"./register"}>Create Account Now</Link>
				</Typography>
				<Typography variant="body1">
				  Returned user with a new device? <Link href={redirect_url?"./add_device?redirect_url="+redirect_url:"./add_device"}>Click Here</Link>
				</Typography>
			  </Stack>
			</Paper>
		  </Container>
		</ThemeProvider>
	  );
}

	*/
function handleSubmit() {}
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
