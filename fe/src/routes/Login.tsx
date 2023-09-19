import {
	Alert,
	Box,
	Button,
	Card,
	CardContent,
	Container,
	CssBaseline,
	Link,
	Paper,
	Stack,
	TextField,
	ThemeProvider,
	Typography,
} from "@mui/material";
import { useNavigate, useSearchParams, useParams } from "react-router-dom";
import React, { useEffect, useState } from "react";
import { LoginID } from "../theme/theme";
import background from "../assets/background.svg";
import { ReactComponent as VaultLogo } from "../assets/logo.svg";
import { ReactComponent as VaultLogoDev } from "../assets/logo-dev.svg";
import vaultSDK from "../lib/VaultSDK";
import { AuthService } from "../services/auth";
import useWindowDimensions from "../hooks/useWindowDimensions";
import jwt_decode from "jwt-decode";
import { EmailDialog } from "../components/dialogs/EmailDialog";

let wsurl = process.env.REACT_APP_VAULT_WS_URL || "ws://localhost:3001";
let ws: WebSocket | null = null;
const Login: React.FC = () => {
	const navigate = useNavigate();
	const [searchParams, setSearchParams] = useSearchParams();
	const { height } = useWindowDimensions();
	let redirect_error = searchParams.get("redirect_error");
	let redirect_url = searchParams.get("redirect_url");
	if (redirect_error == null) {
		redirect_error = "";
	}

	const params = useParams();
	const isDeveloper = params["entry"] === "developer";

	const [username, setUsername] = useState("");
	const [errorMessage, setErrorMessage] = useState(redirect_error);
	const [openEmailDialog, setOpenEmailDialog] = useState<boolean>(false);
	const [sessionId, setSessionId] = useState("");

	useEffect(() => {
		let redirect_url = searchParams.get("redirect_url");
		let u = searchParams.get("u");
		if (u != null) {
			setUsername(u);
		}
	}, []);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		try {
			//check if platform authenticator
      let hasPasskey = await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      if(!hasPasskey) {
        emailLogin(username);
      } else {
        fidoLogin(username);
      }
		} catch (error) {
			setErrorMessage((error as Error).message);
		}
	};

  async function fidoLogin(username: string) {
		try {
        const response = await vaultSDK.authenticate(username);
        AuthService.storeSession({
          username: username,
          token: response.jwt,
        });
        if (redirect_url != null) {
          navigate(redirect_url);
        } else {
          navigate("/home");
        }
		} catch (error) {
			setErrorMessage((error as Error).message);
			emailLogin(username);
		}

  }

	async function emailLogin(email: string) {
		try {
			let appOrigin = window.origin;
			let result = await vaultSDK.sendEmailSession(
				"",
				email,
				"login",
				appOrigin
			);
			setOpenEmailDialog(true);
			setSessionId(result.session);
			ws = new WebSocket(
				wsurl + "/api/federated/email/ws/" + result.session
			);
			ws.onopen = () => {
				ws?.send(JSON.stringify({ email: email, type: "login" }));
			};
			ws.onmessage = (event) => {
				let token = event.data;
				let decoded = jwt_decode(token);
				if (decoded != null) {
					AuthService.storeSession({
						username: username,
						token: token,
					});
          if (redirect_url != null) {
            navigate(redirect_url);
          } else {
            navigate("/home");
          }
					closeEmailDialog();
					//ws?.close();
				}
			};
			ws.onclose = () => {
				// close websocket
				closeEmailDialog();
				setErrorMessage("email session timeout or cancel!");
			};
		} catch (error) {
			setErrorMessage((error as Error).message);
			closeEmailDialog();
		}
	}

	function closeEmailDialog() {
		setOpenEmailDialog(false);
		if (ws != null) {
			ws.close();
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
					height: `${height}px`,
				}}
			>
				<Paper
					elevation={0}
					sx={{
						p: { sm: 4, xs: 2 },
						borderRadius: "2%",
						width: { sm: "400px", xs: "100%" },
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
						{isDeveloper ? <VaultLogoDev /> : <VaultLogo />}
						<Typography variant="body1" marginTop={2}>
							Access securely to your LoginID Wallet Account.
						</Typography>
						{errorMessage.length > 0 && (
							<Alert severity="error">{errorMessage}</Alert>
						)}
						<TextField
							fullWidth
							label="Username"
							value={username}
							onChange={(e) => setUsername(e.target.value)}
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
							<Link
								href={
									redirect_url
										? "./register?redirect_url=" +
										  redirect_url
										: "./register"
								}
							>
								Register
							</Link>
						</Typography>
						<Typography variant="body1">
							Are you a developer?{" "}
							<Link
								href={
									redirect_url
										? "./developer/register?redirect_url=" +
										  redirect_url
										: "./developer/register"
								}
							>
								Developer Account
							</Link>
						</Typography>
						<EmailDialog
							type="login"
							email={username}
							session={sessionId}
							open={openEmailDialog}
							handleClose={closeEmailDialog}
						></EmailDialog>
					</Stack>
				</Paper>
			</Container>
		</ThemeProvider>
	);
};

export default Login;
