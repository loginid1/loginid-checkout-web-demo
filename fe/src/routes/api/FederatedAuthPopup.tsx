import React, {
	ChangeEventHandler,
	createContext,
	useContext,
	useEffect,
	useState,
} from "react";
import { AuthService } from "../../services/auth";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Message, MessagingService } from "../../services/messaging";
import { EnableOpts, EnableResult, WalletInit } from "../../lib/common/api";
import vaultSDK from "../../lib/VaultSDK";
import { AccountList, Genesis } from "../../lib/VaultSDK/vault/algo";
import { ThemeProvider } from "@emotion/react";
import VaultLogo from "../../assets/logo_light.svg";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import AccountIcon from "@mui/icons-material/AccountCircle";
import CheckIcon from "@mui/icons-material/Check";
import styles from "../../styles/common.module.css";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
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
	Divider,
	Avatar,
	List,
	ListItem,
	ListItemAvatar,
	ListItemText,
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
import { ConsentPass } from "../../lib/VaultSDK/vault/federated";
import { Account } from "../../components/Account";

interface WalletLoginSession {
	network: string;
	origin: string;
	requestId: number;
}

export enum AuthPage {
	NONE = "none",
	ERROR = "error",
	LOGIN = "login",
	FIDO_REG = "fido_register",
	CONSENT = "consent",
	PHONE_PASS = "phone_pass",
	FINAL = "final",
}

let wsurl = process.env.REACT_APP_VAULT_WS_URL || "ws://localhost:3001";
const mService = new MessagingService(window.opener);
let input: boolean = false;
let wSession: WalletLoginSession | null = null;
let ws: WebSocket | null = null;

export interface ConsentContextType {
	setMissing: (missing: string[]) => void;
	setPage: (page: AuthPage) => void;
	handleCancel: () => void;
	setDisplayMessage: (msg: DisplayMessage) => void;
}

export const ConsentContext = createContext<ConsentContextType | null>(null);

export default function FederatedAuthPopup() {
	const [searchParams, setSearchParams] = useSearchParams();

	const [waitingIndicator, setWaitingIndicator] = useState<boolean>(true);
	const [showRegister, setShowRegister] = useState<boolean>(false);
	const [username, setUsername] = useState("");
	const [waitingMessage, setWaitingMessage] = useState<string | null>(null);
	const [codeInput, setCodeInput] = useState<boolean>(false);
	const [page, setPage] = useState<AuthPage>(AuthPage.NONE);
	const [openEmailDialog, setOpenEmailDialog] = useState<boolean>(false);
	const [emailType, setEmailType] = useState<string>("login");
	const [sessionId, setSessionId] = useState<string>("");
	const params = useParams();
	const navigate = useNavigate();
	const [enable, setEnable] = useState<WalletLoginSession | null>(null);
	const [displayMessage, setDisplayMessage] = useState<DisplayMessage | null>(
		null
	);
	const [appOrigin, setAppOrigin] = useState<string>("");
	const [appName, setAppName] = useState<string>("");
	const [consent, setConsent] = useState<string[] | null>(null);
	const [token, setToken] = useState("");
	const [missing, setMissing] = useState<string[]>([]);

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
		if (page === AuthPage.CONSENT) {
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

				setPage(AuthPage.CONSENT);

				setDisplayMessage({
					text: "Registration completed!",
					type: "info",
				});
			} else if (msg.type === "init") {
				let api: WalletInit = JSON.parse(msg.data);
				vaultSDK
					.sessionInit(origin, api.api)
					.then((response) => {
						setPage(AuthPage.LOGIN);
						setAppOrigin(origin);
						clearAlert();
						setSessionId(response.id);
						console.log("session ", response.id);
					})
					.catch((error) => {
						clearAlert();
						setPage(AuthPage.ERROR);
						setDisplayMessage({
							text: (error as Error).message,
							type: "error",
						});
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
			if (
				consent.required_attributes == null ||
				consent.required_attributes.length === 0
			) {
				mService.sendMessageText(consent.token);
				setPage(AuthPage.FINAL);
			} else {
				if (consent.missing_attributes.length > 0) {
					if (consent.missing_attributes[0] === "phone") {
						setPage(AuthPage.PHONE_PASS);
					}
				}
			}
		} catch (e) {
			setConsent(null);
			setAppName("");
			setDisplayMessage({ type: "error", text: (e as Error).message });
			setPage(AuthPage.ERROR);
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

	async function registerFido() {
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
		window.close();
	}

	async function handleClose() {
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

				{page === AuthPage.ERROR && ErrorPage()}
				{page === AuthPage.LOGIN && Login()}
				{page === AuthPage.FIDO_REG && Fido()}
				{page === AuthPage.CONSENT && (
					<ConsentContext.Provider
						value={{
							setMissing,
							setPage,
							handleCancel,
							setDisplayMessage,
						}}
					>
						<Consent session={sessionId} username={username} />
					</ConsentContext.Provider>
				)}

				{page === AuthPage.PHONE_PASS && (
					<ConsentContext.Provider
						value={{
							setMissing,
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
				{showRegister && (
					<Button
						fullWidth
						variant="text"
						onClick={handleSignup}
						size="small"
						sx={{ mt: 1, mb: 1 }}
					>
						Signup
					</Button>
				)}
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

	function ErrorPage() {
		<>
			{displayMessage && (
				<Alert
					severity={(displayMessage?.type as AlertColor) || "info"}
					sx={{ mt: 2 }}
				>
					{displayMessage.text}
				</Alert>
			)}
		</>;
	}

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

function Consent(props: { session: string; username: string }) {
	const { setMissing, setPage, setDisplayMessage, handleCancel } =
		useContext<ConsentContextType | null>(
			ConsentContext
		) as ConsentContextType;
	const [appName, setAppName] = useState<string>("");
	const [passes, setPasses] = useState<ConsentPass[]>([]);
	const [load, setLoad] = useState<boolean>(false);
	useEffect(() => {
		checkConsent();
	}, []);

	async function checkConsent() {
		try {
			let consent = await vaultSDK.checkConsent(props.session);
			console.log(consent);
			setPasses(consent.passes);
			setAppName(consent.app_name);
			if (
				consent.required_attributes == null ||
				consent.required_attributes.length === 0
			) {
				mService.sendMessageText(consent.token);
				setPage(AuthPage.FINAL);
			} else {
				if (consent.missing_attributes.length > 0) {
					setMissing(consent.missing_attributes);
					if (consent.missing_attributes[0] === "phone") {
						setPage(AuthPage.PHONE_PASS);
					}
				} else {
					// load consent page
					setLoad(true);
				}
			}
		} catch (e) {
			setDisplayMessage({ type: "error", text: (e as Error).message });
			setPage(AuthPage.ERROR);
		}
	}

	async function saveConsent() {
		//console.log("save consent");
		let consent = await vaultSDK.saveConsent(props.session);
		//console.log(consent.token);
		mService.sendMessageText(consent.token);
		setPage(AuthPage.FINAL);
	}

	if (load) {
		return (
			<Stack>
				<Typography
					sx={{ m: 1 }}
					variant="body1"
					color="text.secondary"
				>
					You have successfully logged in as:
				</Typography>
				<Chip
					icon={<AccountIcon />}
					label={props.username}
					sx={{ mb: 2 }}
				></Chip>
				<Divider variant="fullWidth" />
				{passes && (
					<>
						<Typography
							sx={{ m: 1 }}
							variant="body2"
							color="text.secondary"
						>
							Do you consent on sharing the following information
							with <strong>{appName}</strong>?
						</Typography>
						<Stack
							direction="column"
							justifyContent="center"
						>
							{passes?.map((pass) => (
								 <List dense={true} sx={{ width: '100%', maxWidth: 300, bgcolor: 'background.paper' }}>
								 <ListItem>
								   <ListItemAvatar>
									 <Avatar>
									   <PassIcon type={pass.type}/>
									 </Avatar>
								   </ListItemAvatar>
								   <ListItemText primary={pass.data}  />
								 </ListItem>
							   </List>
							))}
						</Stack>
						<Button
							fullWidth
							variant="contained"
							onClick={saveConsent}
							size="small"
							sx={{ mt: 2, mb: 1 }}
						>
							Confirm
						</Button>
					</>
				)}
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
	} else {
		return <></>;
	}
}

function PhonePassPage(props: { session: string; username: string }) {
	const [phone, setPhone] = useState<string>("");
	const [showCode, setShowCode] = useState<boolean>(false);
	const [allowConfirm, setAllowConfirm] = useState<boolean>(false);
	const [code, setCode] = useState<string>("");
	const { setMissing, setPage, setDisplayMessage, handleCancel } =
		useContext<ConsentContextType | null>(
			ConsentContext
		) as ConsentContextType;

	async function handleVerify() {
		const token = AuthService.getToken();
		if (token) {
			try {
				console.log(phone);
				await vaultSDK.createPhonePassInit(token, "+"+phone);
				setShowCode(true);
			} catch (err) {
				console.error(err);
			}
		}
	}

	async function handleConfirm() {
		const token = AuthService.getToken();
		if (token) {
			try {
				console.log(phone);
				await vaultSDK.createPhonePassComplete(token,"My Phone", "+"+phone, code);
				setPage(AuthPage.CONSENT);
			} catch (err) {
				console.error(err);
			}
		}
	}
	function validateCode(value: string) {
		let pattern = new RegExp("^[0-9]+$|^$");
		if (pattern.test(value)) {
			setCode(value);
			if (value.length === 6){
				setAllowConfirm(true);
			} else {
				setAllowConfirm(false);
			}
		}
		
	}
	return (
		<Stack>
			<Typography sx={{ m: 2 }} variant="body2" color="text.secondary">
				Add a phone number
			</Typography>
			<Stack direction="row" sx={{mt: 2, mb:1}}>
				<PhoneInput
					inputStyle={{
						width: "100%",
						height: "35px",
						fontSize: "13px",
						borderRadius: "5px",
					}}
					enableLongNumbers
					country={"us"}
					value={phone}
					onChange={(value) => setPhone(value)}
				/>
			</Stack>
			{showCode && (
				<>
			<Typography sx={{ m: 1 }} variant="caption" color="text.secondary">
				Enter code received from your phone
			</Typography>
				<CodeInput
					inputName="code"
					validateCode={validateCode}
				></CodeInput>
				</>
			)}

			{showCode == false && (
				<Button
					fullWidth
					variant="contained"
					size="small"
					sx={{ mt: 1, mb: 1 }}
					onClick={handleVerify}
				>
					Verify Number
				</Button>
			)}
			{showCode && (
				<Button
					fullWidth
					variant="contained"
					size="small"
					sx={{ mt: 1, mb: 1 }}
					disabled={!allowConfirm}
					onClick={handleConfirm}
				>
					Confirm
				</Button>
			)}
			<Button
				variant="text"
				size="small"
				onClick={handleCancel}
				sx={{ mt: 1, mb: 1 }}
			>
				Close
			</Button>
		</Stack>
	);
}

function PassIcon(props: { type: string }) {
	if (props.type === "email") {
		return <EmailIcon fontSize="small" color="primary" />;
	} else if (props.type === "phone") {
		return <PhoneIcon  fontSize="small" color="primary"/>;
	} else {
		return <AccountIcon fontSize="small" color="primary"/>;
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
