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
import React, { useState, useEffect } from "react";
import { LoginID } from "../../theme/theme";
import background from "../../assets/background.svg";
import { ReactComponent as VaultLogo } from "../../assets/logo.svg";
import vaultSDK from "../../lib/VaultSDK";
import { AuthService } from "../../services/auth";
import { CodeInput } from "../../components/CodeInput";
import { TermDialog } from "../../components/dialogs/TermOfServiceDialog";

export default function EmailValidation() {
	const navigate = useNavigate();
	const [searchParams, setSearchParams] = useSearchParams();

	let aUsername = searchParams.get("username");
	const [username, setUsername] = useState(aUsername || "");

	const [errorMessage, setErrorMessage] = useState("");
	const [termOpen, setTermOpen] = useState<boolean>(false);
	const [type, setType] = useState<string>("register");

	useEffect(() => {
		let token = searchParams.get("token");
		if (token != null) {
			validateEmail(token);
		}
	}, []);

	async function validateEmail(token: string) {
		try {
			const response = await vaultSDK.federated_validate_email(token);
			setType(response.type);
		} catch (error) {
			setErrorMessage((error as Error).message);
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
						spacing={2}
						sx={{
							display: "flex",
							flexDirection: "column",
							justifyContent: "center",
							alignItems: "left",
						}}
					>
						<VaultLogo />
						<Typography
							variant="body1"
							marginTop={2}
							maxWidth="400px"
							align="left"
						>
							{type === "register" &&
							<p>
							Thank you for confirming your email. Please go back
							to the site where you registered and complete the
							Passkey registration within 5 minutes.
							</p>
							}
							{type === "login" &&
							<p>
							`Thank you for confirming your email. Please go back
							to the site where you login to complete.`
							</p>
							}
						</Typography>
						{errorMessage.length > 0 && (
							<Alert severity="error">{errorMessage}</Alert>
						)}
						<Typography variant="body2" align="left">
							<Link href="/login">
								Go to LoginID Wallet account{" "}
							</Link>
						</Typography>
						<Typography variant="body2" align="left">
							<Link href="/faq">
								Learn more about the LoginID Wallet{" "}
							</Link>
						</Typography>
					</Stack>
				</Paper>
			</Container>
		</ThemeProvider>
	);
}
