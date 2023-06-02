import {
	Alert,
	AlertColor,
	Typography,
	TextField,
	Button,
	Stack,
	Link,
	Box,
} from "@mui/material";
import { useContext, useEffect, useState } from "react";
import { DisplayMessage } from "../../lib/common/message";
import {
	ConsentContextType,
	ConsentContext,
	AuthPage,
	AuthContextType,
	AuthContext,
} from "../../lib/federated";
import vaultSDK from "../../lib/VaultSDK";
import { SessionInitResponse } from "../../lib/VaultSDK/vault/federated";
import { AuthService } from "../../services/auth";
import { TermDialog } from "../dialogs/TermOfServiceDialog";
import jwt_decode from "jwt-decode";
import { EmailDialog } from "../dialogs/EmailDialog";
import { PassIcon } from "./Icons";

let wsurl = process.env.REACT_APP_VAULT_WS_URL || "ws://localhost:3001";
let ws: WebSocket | null = null;
export function LoginPage(props: {
	session: SessionInitResponse;
	username: string;
}) {
	const {
		username,
		setUsername,
		postMessage,
		setPage,
		handleCancel,
		setToken,
	} = useContext<AuthContextType | null>(AuthContext) as AuthContextType;

	const [displayMessage, setDisplayMessage] = useState<DisplayMessage | null>(
		null
	);
	const [termOpen, setTermOpen] = useState<boolean>(false);
	const [openEmailDialog, setOpenEmailDialog] = useState<boolean>(false);
	const [attributes, setAttributes] = useState<string[]>([]);
	const [emailType, setEmailType] = useState<string>("login");
	const [waitingIndicator, setWaitingIndicator] = useState<boolean>(true);

	useEffect(() => {
		setAttributes(props.session.attributes);
	}, []);
	async function handleLogin() {
		try {
			if (!(await vaultSDK.checkUser(username))) {
				// handle email register
				emailRegister();
			} else {
				const response = await vaultSDK.federated_authenticate(
					username,
					props.session.id
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
				props.session.id,
				username,
				"register",
				props.session.origin
			);
			//setWaitingMessage("Check email for login session")
			setWaitingIndicator(true);
			setEmailType("register");
			setOpenEmailDialog(true);
			ws = new WebSocket(
				wsurl + "/api/federated/email/ws/" + props.session.id
			);
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
			ws.onclose = () => {
				closeEmailDialog();
			};
		} catch (error) {
			setDisplayMessage({
				type: "error",
				text: (error as Error).message,
			});
			closeEmailDialog();
			//postMessage("error", (error as Error).message);
		}
	}

	async function emailLogin(email: string) {
		try {
			await vaultSDK.sendEmailSession(
				props.session.id,
				email,
				"login",
				props.session.origin
			);
			setWaitingIndicator(true);
			setEmailType("login");
			setOpenEmailDialog(true);
			ws = new WebSocket(
				wsurl + "/api/federated/email/ws/" + props.session.id
			);
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
				closeEmailDialog();
				setDisplayMessage({
					text: "email session timeout or cancel!",
					type: "error",
				});
			};
		} catch (error) {
			setDisplayMessage({
				type: "error",
				text: (error as Error).message,
			});
			closeEmailDialog();
		}
	}

	function closeEmailDialog() {
		setWaitingIndicator(false);
		setOpenEmailDialog(false);
		if (ws != null) {
			ws.close();
		}
	}
	function clearAlert() {}

	return (
		<>
			{displayMessage == null && (
				<Box sx={{ m: 2, height: "16px" }}></Box>
			)}
			{displayMessage && (
				<Alert
					severity={(displayMessage?.type as AlertColor) || "info"}
					sx={{ mt: 2 }}
				>
					{displayMessage.text}
				</Alert>
			)}
			<Typography sx={{ m: 1 }} variant="body2" color="text.secondary">
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

			<Typography
				variant="caption"
				color="text.secondary"
				sx={{ mt: 1, mb: 2 }}
			>
				By clicking 'Continue', I agree to the{" "}
				<Link onClick={() => setTermOpen(true)}>terms of service</Link>
				<TermDialog
					open={termOpen}
					handleClose={() => setTermOpen(false)}
				/>
			</Typography>
			<Stack direction="row" justifyContent="center" alignItems="center">
				<Typography
					sx={{ m: 1 }}
					variant="caption"
					color="text.secondary"
				>
					Sign up required:
				</Typography>
				{attributes.map((attr) => (
					<PassIcon key={attr} type={attr} color="info" />
				))}
			</Stack>
			<EmailDialog
				type={emailType}
				email={username}
				session={props.session.id}
				open={openEmailDialog}
				handleClose={closeEmailDialog}
			></EmailDialog>
		</>
	);
}
