import {
	Grid,
	Typography,
	Button,
	Paper,
	TextField,
	Divider,
	Checkbox,
	FormControl,
	FormControlLabel,
	FormGroup,
	FormHelperText,
	FormLabel,
	Alert,
	AlertColor,
	Stack,
	CircularProgress,
	Snackbar,
	SnackbarCloseReason,
} from "@mui/material";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import SyntaxHighlighter from "react-syntax-highlighter";
import { VaultBase } from "../../../components/VaultBase";
import { DisplayMessage } from "../../../lib/common/message";
import vaultSDK from "../../../lib/VaultSDK";
import { VaultApp } from "../../../lib/VaultSDK/vault/developer";
import { AuthService } from "../../../services/auth";

const snippet = `<!DOCTYPE html>
<html lang="en">
<script src="https://loginid-wallet-cdn.s3.us-east-2.amazonaws.com/loginid-wallet-sdk.min.js"></script>
<script>
    window.onload = function () {
        const login = document.getElementById("loginid-button");
        login.onclick = onSignup;
    }
    async function onSignup() {
        const wallet = new loginid.WalletSDK("https://wallet.loginid.io", "%app_id%", null)
        await wallet.signup();
    }
</script>
<body>
    <div id="root">
        <button id="loginid-button">Login</button>
    </div>
</body>
</html>`

export default function UpdateApp() {
	const navigate = useNavigate();
	const [showCopyCodeMessage, setShowCopyCodeMessage] = useState(false);
	const [application, setApplication] = useState<VaultApp>();
	const [displayMessage, setDisplayMessage] = useState<DisplayMessage | null>(
		null
	);
	const [attributeList, setAttributeList] = useState<string[]>([]);
	const [email, setEmail] = useState<boolean>(true);
	const [phone, setPhone] = useState<boolean>(false);
	const { app_id } = useParams();

	useEffect(() => {
		const fetchData = async () => {
			const token = AuthService.getToken();
			if (token) {
				const result = await vaultSDK.getApp(token, app_id);
				setApplication(result);

				let mattrs: string[] = [];
				let attrs = result.attributes.split(",");
				attrs.forEach((value) => {
					if (value === "phone") {
						setPhone(true);
						mattrs.push("phone");
					} else if (value === "email") {
						setEmail(true);
						mattrs.push("email");
					}
				});

				setAttributeList(mattrs);
			}
		}

		fetchData();
	}, []);

	async function handleUpdateApp() {
		const token = AuthService.getToken();
		if (token) {
			// validate fields
			if (application?.app_name.length === 0) {
				setDisplayMessage({ type: "error", text: "name is required" });
				return;
			}
			if (application?.origins.length === 0) {
				setDisplayMessage({
					type: "error",
					text: "origin is required",
				});
				return;
			}

			try {
				if (application) {
					await vaultSDK.updateApp(token, {
						app_name: application?.app_name,
						origins: application?.origins,
						attributes: attributeList.join(),
						id: application?.id,
						uat: "",
					});

					navigate('/developer/console');
				}
			} catch (error) {
				setDisplayMessage({
					type: "error",
					text: (error as Error).message,
				});
			}
		} else {
			// navigate to login
		}
	}

	function handleAttributeChange(key: string, isChecked: boolean) {
		let oldList = attributeList;
		if (isChecked) {
			oldList.push(key);
			setAttributeList(oldList);
		} else {
			//setFormCredIDList(formCredIDList.filter((item) => item !== id));
			oldList = oldList.filter((item) => item !== key);
			setAttributeList(oldList);
		}

		if (key === "email") {
			setEmail(isChecked);
		}
		if (key === "phone") {
			setPhone(isChecked);
		}
	}

	const handleCloseCopyCodeMessage = (event: Event | React.SyntheticEvent<any, Event>, reason: SnackbarCloseReason) => {
		if (reason === 'clickaway') {
			return;
		}
		setShowCopyCodeMessage(false);
	};
	
	const copyCode = () => {
		if (application) {
			setShowCopyCodeMessage(true);
			navigator.clipboard.writeText(snippet.replace("%app_id%", application?.id));
		}
	};

	return (
		<VaultBase focus={"developer"}>
			<Typography
				variant="h2"
				color="secondary"
				align="left"
				sx={{
					padding: { md: 4, xs: 2 },
				}}
			>
				Update Application
			</Typography>
			{
				application === undefined ? 
				(
					<Stack direction="row" justifyContent="center">
						<CircularProgress />
					</Stack>
				) : (
			
					<Paper
						elevation={0}
						sx={{
							p: { md: 4, xs: 2 },
							mb: 2,
							display: "flex",
							justifyContent: "center",
						}}
					>
						<Grid container spacing={{ md: 2, xs: 1 }}>
							{displayMessage && (
								<Grid container item xs={12}>
									<Alert
										severity={
											(displayMessage?.type as AlertColor) ||
											"info"
										}
									>
										{displayMessage.text}
									</Alert>
								</Grid>
							)}
							<Grid container item xs={12}>
								<TextField
									fullWidth
									label="API"
									value={application?.id}
									size="small"
									disabled
								/>
							</Grid>
							<Grid container item xs={12}>
								<TextField
									fullWidth
									label="App Name"
									value={application?.app_name}
									size="small"
									onChange={(e) => {
										if (application) {
											setApplication({...application, app_name: e.target.value})
										}
									}}
								/>
							</Grid>
							<Grid container item xs={12}>
								<TextField
									fullWidth
									label="Origin"
									value={application?.origins}
									size="small"
									helperText="domain name i.e. https://example.com , http://localhost:3000"
									onChange={(e) => {
										if (application) {
											setApplication({...application, origins: e.target.value})
										}
									}}
								/>
							</Grid>
							<Grid item xs={12}>
								<Divider variant="fullWidth"></Divider>
							</Grid>
							<Grid item xs={12}>
								<FormControl
									sx={{ m: 1 }}
									component="fieldset"
									variant="standard"
									fullWidth
								>
									<FormLabel component="legend">
										Identification Requirements
									</FormLabel>
									<FormGroup>
										<FormControlLabel
											control={
												<Checkbox
													disabled
													readOnly
													checked={email}
													// onChange={(e) =>
													// 	handleAttributeChange(
													// 		"email",
													// 		e.target.checked
													// 	)
													// }
													name="email"
												/>
											}
											label="Email Verification"
										/>
										<FormControlLabel
											control={
												<Checkbox
													checked={phone}
													onChange={(e) =>
														handleAttributeChange(
															"phone",
															e.target.checked
														)
													}
													name="phone"
												/>
											}
											label="Phone Verification"
										/>
									</FormGroup>
									<FormHelperText>
										Attribute will required user to consent
									</FormHelperText>
								</FormControl>
							</Grid>
							<Grid item xs={12} sx={{textAlign: "left"}}>
								<SyntaxHighlighter language="html" showLineNumbers>
									{ application ? snippet.replace("%app_id%", application?.id) : "" }
								</SyntaxHighlighter>
								<Button
									variant="text"
									size="large"
									sx={{ mr: 2 }}
									onClick={copyCode}
								>
									Copy Code Snippet
								</Button>
								<Snackbar
									open={showCopyCodeMessage}
									autoHideDuration={3000}
									onClose={handleCloseCopyCodeMessage}
									message="Code snippet copied to clipboard"
								/>
							</Grid>
							<Grid item xs={12}>
								<Button
									variant="text"
									size="large"
									sx={{ mr: 2 }}
									onClick={() => navigate("/developer/console")}
								>
									Cancel
								</Button>
								<Button
									variant="contained"
									size="large"
									onClick={handleUpdateApp}
								>
									Update
								</Button>
							</Grid>
						</Grid>
					</Paper>
				)
			}
		</VaultBase>
	);
}
