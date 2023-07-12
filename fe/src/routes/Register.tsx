import {
	Alert,
	Box,
	Button,
	Checkbox,
	Chip,
	Container,
	CssBaseline,
	FormControlLabel,
	Link,
	Paper,
	Stack,
	TextField,
	ThemeProvider,
	Typography,
} from "@mui/material";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import React, { useEffect, useState } from "react";
import { LoginID } from "../theme/theme";
import background from "../assets/background.svg";
import { ReactComponent as VaultLogo } from "../assets/logo.svg";
import vaultSDK from "../lib/VaultSDK";
import { AuthService } from "../services/auth";
import { CodeInput } from "../components/CodeInput";
import { TermDialog } from "../components/dialogs/TermOfServiceDialog";
import { EmailDialog } from "../components/dialogs/EmailDialog";
import { AuthPage } from "../lib/federated";
import jwt_decode from "jwt-decode";
import FingerprintIcon from "@mui/icons-material/Fingerprint";
import ValidateUtil from "../lib/util/validate";

//export const Register: React.FC = () => {
let wsurl = process.env.REACT_APP_VAULT_WS_URL || "ws://localhost:3001";
let ws: WebSocket | null = null;
export default function Register() {
	const navigate = useNavigate();
	const [searchParams, setSearchParams] = useSearchParams();
	let redirect_url = searchParams.get("redirect_url");

	const [username, setUsername] = useState("");
	const [page, setPage] = useState<AuthPage>(AuthPage.NONE);

	const [errorMessage, setErrorMessage] = useState("");
	const [termOpen, setTermOpen] = useState<boolean>(false);
	const [entry, setEntry] = useState<string>("");
	const [openEmailDialog, setOpenEmailDialog] = useState<boolean>(false);
	const [sessionId, setSessionId] = useState<string>("");
	const [token, setToken] = useState<string>("");

	const params = useParams();

	useEffect(() => {
		console.log(process.env);
		let aEntry = params["entry"];
		if (aEntry != null && aEntry === "algo") {
			setEntry("algo");
		} else if (aEntry != null && aEntry === "developer") {
			setEntry("developer");
		}
	}, []);

	async function register() {
		if (ValidateUtil.isEmailAddress(username)) {
			emailRegister();
		} else {
			fidoRegister();
		}
	}

	// handle email register
	async function emailRegister() {
		try {
			let appOrigin = window.origin;
			
			let result = await vaultSDK.sendEmailSession(
				sessionId,
				username,
				"register",
				appOrigin
			);
			setSessionId(result.session);
			//setWaitingMessage("Check email for login session")
			setOpenEmailDialog(true);
			ws = new WebSocket(
				wsurl + "/api/federated/email/ws/" + result.session
			);
			ws.onopen = () => {
				ws?.send(JSON.stringify({ email: username, type: "register" }));
			};
			ws.onmessage = (event) => {
				let token = event.data;
				let decoded = jwt_decode(token);
				if (decoded != null) {
					setToken(token);
					setPage(AuthPage.FIDO_REG);
					closeEmailDialog();
				}
			};
			ws.onclose = () => {};
		} catch (error) {
			setErrorMessage((error as Error).message);
		}
	}
	// handle fido register
	async function fidoRegister() {
		try {
			const response = await vaultSDK.register(
				username,
				entry,
				sessionId,
				token
			);
			AuthService.storeSession({
				username: username,
				token: response.jwt,
			});
			//navigate("/quick_add_algorand");
			if (entry === "algo") {
				handleAccountCreation();
			} else {
				navigate("/home");
			}
			//AuthService.storePref({ username: username });
		} catch (error) {
			setErrorMessage((error as Error).message);
		}
	}

	function closeEmailDialog() {
		setOpenEmailDialog(false);
		if (ws != null) {
			ws.close();
		}
	}

	async function handleAccountCreation() {
		const token = AuthService.getToken();
		if (token) {
			try {
				const response = await vaultSDK.quickCreateAccount(token);

				if (redirect_url != null) {
					navigate(redirect_url);
				} else {
					navigate("/algorand/accounts", {
						state: response.address,
					});
				}
			} catch (error) {
				setErrorMessage((error as Error).message);
			}
		} else {
			setErrorMessage("missing auth token - retry login");
			return;
		}
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
				{page === AuthPage.NONE && MainPage()}
				{page === AuthPage.FIDO_REG && FidoPage()}

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

	function MainPage() {
		return (
			<>
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

						<Typography
							variant="body1"
							marginTop={2}
							maxWidth="400px"
						>
							Create a LoginID Wallet Account and manage your
							Identities with Security and Ease.
						</Typography>
						{errorMessage.length > 0 && (
							<Alert severity="error">{errorMessage}</Alert>
						)}
						<TextField
							fullWidth
							label="Username"
							value={username}
							focused
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
							type="submit"
							variant="contained"
							size="large"
							sx={{ mt: 3, mb: 2 }}
							onClick={register}
						>
							Create Account
						</Button>
						<Typography variant="body1">
							Already have an account?{" "}
							<Link
								href={
									redirect_url
										? "./login?redirect_url=" + redirect_url
										: "./login"
								}
							>
								Login
							</Link>
						</Typography>
						<Typography variant="body1">
							Returned user with a new device?{" "}
							<Link
								href={
									redirect_url
										? "./add_device?redirect_url=" +
										  redirect_url
										: "./add_device"
								}
							>
								Click Here
							</Link>
						</Typography>
					</Stack>
				</Paper>
			</>
		);
	}

	function FidoPage() {
		return (

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

				{errorMessage.length > 0 && (
					<Alert severity="error">{errorMessage}</Alert>
				)}


				<Typography
					sx={{ m: 1 }}
					variant="body2"
					color="text.secondary"
					textAlign="left"
					maxWidth="400px"
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
					size="large"
					sx={{ mt: 3, mb: 2 }}
					onClick={fidoRegister}
				>
					Create A Passkey
				</Button>
			</Stack>
		</Paper>
		);
	}
}
