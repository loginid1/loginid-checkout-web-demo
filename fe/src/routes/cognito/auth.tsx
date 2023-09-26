import { ThemeProvider } from "@emotion/react";
import { CssBaseline, Container, Paper, Stack, Typography, Alert, TextField, Button } from "@mui/material";
import { height } from "@mui/system";
import { useState } from "react";
import { Link } from "react-router-dom";
import { EmailDialog } from "../../components/dialogs/EmailDialog";
import { LoginID } from "../../theme/theme";
import background from "../../assets/background.svg";
import { ReactComponent as VaultLogo } from "../../assets/logo.svg";
import useWindowDimensions from "../../hooks/useWindowDimensions";

export function CognitoAuth() {
	const { height } = useWindowDimensions();
	const [errorMessage, setErrorMessage] = useState<string>("");
	const [username, setUsername] = useState("");
    function handleSubmit(){}
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
                        <VaultLogo />
						<Typography variant="body1" marginTop={2}>
							Access securely to your LoginID Wallet Account.
						</Typography>
						{errorMessage.length > 0 && (
							<Alert severity="error">{errorMessage}</Alert>
						)}
						<TextField
							fullWidth
							label="Username"
                            id="username"
							value={username}
							onChange={(e) => setUsername(e.target.value)}
						/>
						<Button
							type="submit"
							variant="contained"
							size="large"
							sx={{ mt: 4, mb: 2 }}
						>
							Signin with Password
						</Button>
                        <iframe frameBorder={0}
                        src="/cognito/passwordless"></iframe>
                        {
                            /*
                        
						<EmailDialog
							type="login"
							email={username}
							session={sessionId}
							open={openEmailDialog}
							handleClose={closeEmailDialog}
						></EmailDialog>
                            */
                        }
					</Stack>
				</Paper>
			</Container>
		</ThemeProvider>
    )
}