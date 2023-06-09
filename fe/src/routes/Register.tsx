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
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import React, { useEffect, useState } from "react";
import { LoginID } from "../theme/theme";
import background from "../assets/background.svg";
import { ReactComponent as VaultLogo } from "../assets/logo.svg";
import vaultSDK from "../lib/VaultSDK";
import { AuthService } from "../services/auth";
import { CodeInput } from "../components/CodeInput";
import { TermDialog } from "../components/dialogs/TermOfServiceDialog";

//export const Register: React.FC = () => {
export default function Register() {
	const navigate = useNavigate();
	const [searchParams, setSearchParams] = useSearchParams();
	let redirect_url = searchParams.get("redirect_url");

	const [username, setUsername] = useState("");

	const [errorMessage, setErrorMessage] = useState("");
	const [termOpen, setTermOpen] = useState<boolean>(false);
	const [entry, setEntry] = useState<string>("wallet");

	
	const params = useParams();
	
	useEffect(()=>{
		let aEntry = params["entry"];
		if(aEntry != null && aEntry === "algo"){
			setEntry("algo");
		}
	},[]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		try {
			const response = await vaultSDK.register(username);
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
      AuthService.storePref({username:username});
		} catch (error) {
			setErrorMessage((error as Error).message);
		}
	};

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
						<Typography
							variant="body1"
							marginTop={2}
							maxWidth="400px"
						>
							Create a FIDO Vault Account and manage your Crypto
							Accounts with Security and Ease.
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
							size="large"
							sx={{ mt: 3, mb: 2 }}
						>
							Create Account
						</Button>
						<Typography variant="body1">
							Already have an account?{" "}
							<Link href={redirect_url?"./login?redirect_url="+redirect_url:"./login"}>Login</Link>
						</Typography>
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
