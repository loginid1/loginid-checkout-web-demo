import {
	Alert,
	Box,
	Button,
	Checkbox,
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
import { useNavigate, useSearchParams } from "react-router-dom";
import React, { useState , useEffect} from "react";
import { LoginID } from "../../theme/theme";
import background from "../../assets/background.svg";
import { ReactComponent as VaultLogo } from "../../assets/logo.svg";
import vaultSDK from "../../lib/VaultSDK";
import { AuthService } from "../../services/auth";
import { CodeInput } from "../../components/CodeInput";
import { TermDialog } from "../../components/dialogs/TermOfServiceDialog";
import { Message, MessagingService } from "../../services/messaging";

const mService = new MessagingService(window.opener);
export default function FederatedRegister() {
	const navigate = useNavigate();
	const [searchParams, setSearchParams] = useSearchParams();
	let redirect_url = searchParams.get("redirect_url");

	let aUsername = searchParams.get("username");
	const [username, setUsername] = useState(aUsername || "");

	const [errorMessage, setErrorMessage] = useState("");
	const [termOpen, setTermOpen] = useState<boolean>(false);

	useEffect(() => {

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
			if(msg.type == "register_init") {
				
			}
		
		} catch (error) {
			console.log(error);
		}
	}
	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		try {
			const response = await vaultSDK.federated_register(username);
			AuthService.storeSession({
				username: username,
				token: response.jwt,
			});
			let message = {type:"register_complete", channel:"register", data:response.jwt, id: mService.id}
			mService.sendMessage(message);
			window.close();
			//navigate("/quick_add_algorand");
			//handleAccountCreation();
      AuthService.storePref({username:username});
		} catch (error) {
			setErrorMessage((error as Error).message);
		}
	};

	async function handleCancel(){
		let message = {type:"register_cancel", channel:"register", data:"user cancel", id: mService.id}
		mService.sendMessage(message)
		window.close();
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
					<Stack
						component="form"
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
							Create a new account to login to XYZ app. 
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
							<Link onClick={()=>setTermOpen(true)} >terms of service</Link>
							<TermDialog open={termOpen} handleClose={()=>setTermOpen(false)}/>
						</Typography>
						<Button
							type="submit"
							variant="contained"
							size="small"
							sx={{ mt: 3, mb: 0 }}
							onClick={handleSubmit}
						>
							Create Account
						</Button>
						<Button
							type="submit"
							variant="text"
							size="small"
							onClick={handleCancel}
							sx={{ mt: 0, mb: 2 }}
						>
							Cancel
						</Button>
						<Typography variant="body1">
							Returned user with a new device?{" "}
							<Link href={redirect_url?"./add_device?redirect_url="+redirect_url:"./add_device"}>Click Here</Link>
						</Typography>
					</Stack>
				</Paper>
			</Container>
		</ThemeProvider>
	);
}
