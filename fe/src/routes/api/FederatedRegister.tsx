import {
	Alert,
	AlertColor,
	Box,
	Button,
	Checkbox,
	Chip,
	Container,
	CssBaseline,
	FormControlLabel,
	LinearProgress,
	Link,
	Paper,
	Stack,
	TextField,
	ThemeProvider,
	Typography,
} from "@mui/material";
import { useNavigate, useSearchParams } from "react-router-dom";
import React, { useState, useEffect } from "react";
import { LoginID } from "../../theme/theme";
import background from "../../assets/background.svg";
import { ReactComponent as VaultLogo } from "../../assets/logo.svg";
import vaultSDK from "../../lib/VaultSDK";
import { AuthService } from "../../services/auth";
import { CodeInput } from "../../components/CodeInput";
import { TermDialog } from "../../components/dialogs/TermOfServiceDialog";
import { Message, MessagingService } from "../../services/messaging";
import EmailIcon from "@mui/icons-material/Email";

import jwt_decode from "jwt-decode";
import { DisplayMessage } from "../../lib/common/message";
import { EmailDialog } from "../../components/dialogs/EmailDialog";
const mService = new MessagingService(window.opener);
let wsurl = process.env.REACT_APP_VAULT_WS_URL || "ws://localhost:3001";
let ws: WebSocket | null = null;
export default function FederatedRegister() {
	const navigate = useNavigate();
	const [searchParams, setSearchParams] = useSearchParams();
	const [waitingIndicator, setWaitingIndicator] = useState<boolean>(false);
	let redirect_url = searchParams.get("redirect_url");

	const [username, setUsername] = useState<string>("");

	const [sessionId, setSessionId] = useState("");
	const [token, setToken] = useState("");
	const [page, setPage] = useState<string>("email");

	const [errorMessage, setErrorMessage] = useState("");
	const [termOpen, setTermOpen] = useState<boolean>(false);
	const [openEmailDialog, setOpenEmailDialog] = useState<boolean>(false);
	const [displayMessage, setDisplayMessage] = useState<DisplayMessage | null>(
		null
	);

	const [appOrigin, setAppOrigin] = useState<string>("");
	useEffect(() => {
		let aUsername = searchParams.get("username");
		if (aUsername != null) {
			setUsername(aUsername);
		}
		let aSession = searchParams.get("session");
		if (aSession != null) {
			setSessionId(aSession);
		}
		let aOrigin = searchParams.get("appOrigin");
		if (aOrigin != null) {
			setAppOrigin(aOrigin);
		}

		let target = window.parent;
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
			//checkSession();
		} else {
			//setErrorMessage({ text: "Missing dApp origin", type: "error" });
			//navigate("/login");
		}
	}, []);

	function onMessageHandle(msg: Message, origin: string) {
		try {
			mService.origin = origin;
			mService.id = msg.id;
			// validate enable
			if (msg.type == "register_init") {
			}
		} catch (error) {
			console.log(error);
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
			let message = {
				type: "register_complete",
				channel: "register",
				data: response.jwt,
				id: mService.id,
			};
			mService.sendMessage(message);
			window.close();
			//navigate("/quick_add_algorand");
			//handleAccountCreation();
			AuthService.storePref({ username: username });
		} catch (error) {
			setErrorMessage((error as Error).message);
		}
	}

	async function emailRegister() {
		console.log(sessionId);
		try {
			await vaultSDK.sendEmailSession(sessionId, username, "register", appOrigin);
			//setWaitingMessage("Check email for login session")
			setWaitingIndicator(true);
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
					//ws?.close();
					// register fido
				}
			};
			ws.onclose = () => {
			};
		} catch (error) {
			setDisplayMessage({type:"error", text:(error as Error).message})
		}
	}

	function closeEmailDialog() {
		setWaitingIndicator(false);
		setOpenEmailDialog(false);
		if (ws != null) {
			ws.close();
		}
	}
	async function handleCancel() {
		let message = {
			type: "register_cancel",
			channel: "register",
			data: "user cancel",
			id: mService.id,
		};
		mService.sendMessage(message);
		window.close();
	}

	return (
		<ThemeProvider theme={LoginID}>
			{waitingIndicator && <LinearProgress />}
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
						spacing={2}
						sx={{
							display: "flex",
							flexDirection: "column",
							justifyContent: "center",
							alignItems: "center",
						}}
					>
						<VaultLogo />

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
						{page === "email" && Email()}
						{page === "fido" && Fido()}
					</Stack>
				</Paper>

				<EmailDialog
					type="register"
					email={username}
					session={sessionId}
					open={openEmailDialog}
					handleClose={closeEmailDialog}
				></EmailDialog>
			</Container>
		</ThemeProvider>
	);

	function Email() {
		return (
			<>
				<Typography variant="body1" marginTop={2} maxWidth="400px">
					Create a new account to login to {appOrigin}.
				</Typography>
				{errorMessage.length > 0 && (
					<Alert severity="error">{errorMessage}</Alert>
				)}
				<TextField
					fullWidth
					label="Email"
					name="email"
					value={username}
					onChange={(e) => setUsername(e.target.value)}
				/>
				<Typography variant="body1">
					By clicking 'Create Account', I agree to the{" "}
					<Link onClick={() => setTermOpen(true)}>
						terms of service
					</Link>
					<TermDialog
						open={termOpen}
						handleClose={() => setTermOpen(false)}
					/>
				</Typography>
				<Button
					variant="contained"
					size="small"
					sx={{ mt: 3, mb: 0 }}
					onClick={emailRegister}
				>
					Create Account
				</Button>
				<Button
					variant="text"
					size="small"
					onClick={handleCancel}
					sx={{ mt: 0, mb: 2 }}
				>
					Cancel
				</Button>
			</>
		);
	}

	function Fido() {
		return (
			<>
				{errorMessage.length > 0 && (
					<Alert severity="error">{errorMessage}</Alert>
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
			</>
		);
	}
}
