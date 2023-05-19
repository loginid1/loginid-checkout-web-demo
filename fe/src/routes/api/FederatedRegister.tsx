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
		let aToken = searchParams.get("token");
		if (aToken != null) {
			setToken(aToken);
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

			AuthService.storeSession({
				username: username,
				token: response.jwt,
			});
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
									(displayMessage?.type as AlertColor) ||
									"info"
								}
								sx={{ mt: 2 }}
							>
								{displayMessage.text}
							</Alert>
						)}
						{Register()}
					</Stack>
				</Paper>
			</Container>
		</ThemeProvider>
	);

	function Register() {
		return (
			<>
				<Typography variant="body2" marginTop={2} maxWidth="400px" align="left">
					<p>

					Create a passkey to securely login to all apps powered by
					LoginID Wallet using your device biometric.
					</p>
					Your biometric information never leaves the device.
					<p>

					</p>
				</Typography>
				{errorMessage.length > 0 && (
					<Alert severity="error">{errorMessage}</Alert>
				)}
				<TextField
					fullWidth
					label="Email"
					name="email"
					disabled
					value={username}
					onChange={(e) => setUsername(e.target.value)}
				/>
				<Button
					variant="contained"
					size="small"
					sx={{ mt: 3, mb: 0 }}
					onClick={registerFido}
				>
					Create Passkey
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
