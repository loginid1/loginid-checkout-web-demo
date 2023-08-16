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
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import SyntaxHighlighter from "react-syntax-highlighter";
import { WebflowIntegrationDialog } from "../../../components/dialogs/WebflowIntegrationDialog";
import { VaultBase } from "../../../components/VaultBase";
import { DisplayMessage } from "../../../lib/common/message";
import vaultSDK from "../../../lib/VaultSDK";
import { VaultApp } from "../../../lib/VaultSDK/vault/developer";
import { AuthService } from "../../../services/auth";
import { WebflowService } from "../../../services/webflow";

const wallet_url =
	process.env.REACT_APP_WALLET_URL || "https://wallet.loginid.io";

export default function UpdateApp() {
	const navigate = useNavigate();
	const [searchParams, setSearchParams] = useSearchParams();
	const [showCopyCodeMessage, setShowCopyCodeMessage] = useState(false);
	const [application, setApplication] = useState<VaultApp>();
	const [displayMessage, setDisplayMessage] = useState<DisplayMessage | null>( null);
	const [attributeList, setAttributeList] = useState<string[]>([]);
	const [email, setEmail] = useState<boolean>(true);
	const [phone, setPhone] = useState<boolean>(false);
	const { app_id } = useParams();

	const [onSuccessUrl, setOnSuccessUrl] = useState<string>("");

	const [openWebflow, setOpenWebflow] = useState<boolean>(false);

	const redirect_block_template = `document.location.href='${onSuccessUrl}';`;

	var webflow_custom_source = `
    window.onload = function () {
        const loginidDom = document.getElementById('loginid-button');
        loginidDom.addEventListener('click', async function(event){
            event.preventDefault();
            let api = loginidDom.getAttribute("loginid-api");
            if(api == null) {
                api = '${app_id}';
            }
            const wallet = new loginid.WalletSDK(
				'${wallet_url}', api, null
				);
            const response = await wallet.signup();
            document.cookie = 'loginid-token='+response.token;
                
            let redirect_success = loginidDom.getAttribute("loginid-success");
            if (redirect_success) {
                document.location.href=redirect_success;
            } else {
                redirect_success = loginidDom.getAttribute("href");
                document.location.href=redirect_success;
            }
        });
    }

	`;

	var snippet = `
<script src='https://sdk-cdn.wallet.loginid.io/loginid-wallet-sdk.min.js' async defer></script>
<script>
		${webflow_custom_source}
</script>
`;
	const add_button = `
<html>
...
...
<body>
    <div id="root">
        <button id="loginid-button">Login</button>
    </div>
</body>
</html>
`;
	useEffect(() => {
		let webflow = searchParams.get("webflow");
		if(webflow) {
			setOpenWebflow(true);
		}

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
		};

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

					navigate("/developer/console");
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

	const handleCloseCopyCodeMessage = (
		event: Event | React.SyntheticEvent<any, Event>,
		reason: SnackbarCloseReason
	) => {
		if (reason === "clickaway") {
			return;
		}
		setShowCopyCodeMessage(false);
	};

	const copyCode = () => {
		if (application) {
			setShowCopyCodeMessage(true);
			navigator.clipboard.writeText(
				snippet.replace("%app_id%", application?.id)
			);
		}
	};

	async function uploadWebflow() {
		let access_token = WebflowService.getToken();
		if (access_token == null) {
			try {
				let response = await vaultSDK.getWebflowAuthorizeUrl();
				console.log(window.location.pathname);
				WebflowService.saveNavigation(window.location.pathname + "?webflow=true");
				window.location.assign(response.url);
			} catch (error) {
				setDisplayMessage({
					type: "error",
					text: (error as Error).message,
				});
			}
		} else {
			// upload script
			let sites = WebflowService.getSites();
			console.log(sites);
			try {
				let response = await vaultSDK.uploadWebflowScript(
					access_token,
					sites[1].id,
					webflow_custom_source
				);
				console.log(response);
			} catch (error) {
				setDisplayMessage({
					type: "error",
					text: (error as Error).message,
				});
			}
		}
	}

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
			{application === undefined ? (
				<Stack direction="row" justifyContent="center">
					<CircularProgress />
				</Stack>
			) : (
				<>
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
											setApplication({
												...application,
												app_name: e.target.value,
											});
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
											setApplication({
												...application,
												origins: e.target.value,
											});
										}
									}}
								/>
							</Grid>
							<Grid item xs={12}>
								<Divider variant="fullWidth"></Divider>
							</Grid>
							<Grid item xs={12}>
								<FormControl
									sx={{ m: 1, textAlign: "left" }}
									component="fieldset"
									variant="standard"
									fullWidth
								>
									<FormLabel component="legend">
										<strong>User Identifiers</strong>
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
													disabled
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
											label="Phone Verification (contact support@loginid.io)"
										/>
									</FormGroup>
									<FormHelperText>
										Choose how users will identify themselves on your app or site. If an option is chosen, our wallet will then require users to verify these options prior in order for their account to be created. We are continuously adding more identifiers with each release.
									</FormHelperText>
								</FormControl>
							</Grid>
							<Grid item xs={12}>
								<Button
									variant="text"
									size="large"
									sx={{ mr: 2 }}
									onClick={() =>
										navigate("/developer/console")
									}
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
					<Typography
						variant="h2"
						color="secondary"
						align="left"
						sx={{
							padding: { md: 4, xs: 2 },
						}}
					>
						Quick Code Setup
					</Typography>
					<Paper
						elevation={0}
						sx={{
							p: { md: 4, xs: 2 },
							mb: 2,
							display: "inline",
							justifyContent: "center",
						}}
					>
						<Grid container spacing={{ md: 2, xs: 1 }}>
							<Grid item xs={12} sx={{ textAlign: "left" }}>
								<Typography
									variant="body1"
									color="text.secondary"
									align="left"
									sx={{
										mt: 2,
										mb: 2,
									}}
								>
									The following script can be use to add
									LoginID Wallet button to your site. This
									script will allow any button with an ID{" "}
									<strong>loginid-button</strong> to call up
									the Wallet "sign up or sign in" window.
								</Typography>
								<Alert
									severity="info"
									action={
										<Button
											color="inherit"
											size="small"
											onClick={() => setOpenWebflow(true)}
										>
											Add to Webflow
										</Button>
									}
								>
									For Webflow integration, you can connect and
									upload the scripts here.
								</Alert>
							</Grid>
							<Grid item xs={12} sx={{ textAlign: "left" }}>
								<SyntaxHighlighter
									language="javascript"
									showLineNumbers
								>
									{application
										? snippet.replace(
												"%app_id%",
												application?.id
										  )
										: ""}
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
						</Grid>
						<WebflowIntegrationDialog
							open={openWebflow}
							app={application}
							source={webflow_custom_source}
							handleClose={() => {
								setOpenWebflow(false);
							}}
						></WebflowIntegrationDialog>
					</Paper>
				</>
			)}
		</VaultBase>
	);
}
