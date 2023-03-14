
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

	useEffect(() => {
	    let token = searchParams.get("token");
        if (token != null) {
            validateEmail(token );
        }
	}, []);

    async function validateEmail(token: string){

        try {
			const response = await vaultSDK.federated_validate_email(token);
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
							alignItems: "center",
						}}
					>
						<VaultLogo />
						<Typography
							variant="body1"
							marginTop={2}
							maxWidth="400px"
						>
							Thank you for confirming your email. 
						</Typography>
						{errorMessage.length > 0 && (
							<Alert severity="error">{errorMessage}</Alert>
						)}
						<Typography variant="body1">
							<Link href="/fe/faq" >
						        Learn more about the FIDO Vault{" "} 
                            </Link>
						</Typography>
						<Button
							type="submit"
							variant="contained"
							size="small"
							sx={{ mt: 3, mb: 0 }}
						>
							Manage My Portal
						</Button>
					</Stack>
				</Paper>
			</Container>
		</ThemeProvider>
	);
}