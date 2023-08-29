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
	ListItem,
	ListItemText,
	List,
	ListItemIcon,
} from "@mui/material";
import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import SyntaxHighlighter from "react-syntax-highlighter";
import { WebflowIntegrationDialog } from "../../../components/dialogs/WebflowIntegrationDialog";
import { WebflowPagesDialog } from "../../../components/dialogs/WebflowPagesDialog";
import { SectionCard } from "../../../components/SectionCard";
import { VaultBase } from "../../../components/VaultBase";
import { DisplayMessage } from "../../../lib/common/message";
import WebIcon from "@mui/icons-material/Web";
import vaultSDK from "../../../lib/VaultSDK";
import {
	IntegrationResult,
	VaultApp,
} from "../../../lib/VaultSDK/vault/developer";
import { AuthService } from "../../../services/auth";
import { WebflowService } from "../../../services/webflow";

const wallet_url =
	process.env.REACT_APP_WALLET_URL || "https://wallet.loginid.io";

export default function UpdateApp() {
	const navigate = useNavigate();
	const [searchParams, setSearchParams] = useSearchParams();
	const [showCopyCodeMessage, setShowCopyCodeMessage] = useState(false);
	const [application, setApplication] = useState<VaultApp>();
	const [displayMessage, setDisplayMessage] = useState<DisplayMessage | null>(
		null
	);
	const [attributeList, setAttributeList] = useState<string[]>([]);
	const [email, setEmail] = useState<boolean>(true);
	const [phone, setPhone] = useState<boolean>(false);
	const { app_id } = useParams();
	const [integration, setIntegration] = useState<IntegrationResult | null>(
		null
	);

	const [onSuccessUrl, setOnSuccessUrl] = useState<string>("");

	const [openWebflow, setOpenWebflow] = useState<boolean>(false);
	const [openPagesDialog, setOpenPagesDialog] = useState<boolean>(false);

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
				'${wallet_url}', 
				api, 
				null
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
<script 
    src='https://sdk-cdn.wallet.loginid.io/loginid-wallet-sdk.min.js' 
	async defer>
</script>
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
		if (webflow) {
			setOpenWebflow(true);
		}

		const fetchData = async () => {
			const token = AuthService.getToken();
			if (token) {
				if (app_id == null) {
					navigate("/developer");
					return;
				}
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
				getIntegration();
			}
		};

		fetchData();
	}, []);

	async function getIntegration() {
		const token = AuthService.getToken();
		// get integration
		if (token && app_id) {

		const inResult = await vaultSDK.getWebflowIntegration(token, app_id);
		setIntegration(inResult);
		}
	}

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
										Choose how users will identify
										themselves on your app or site. If an
										option is chosen, our wallet will then
										require users to verify these options
										prior in order for their account to be
										created. We are continuously adding more
										identifiers with each release.
									</FormHelperText>
								</FormControl>
							</Grid>
							<Grid item xs={12}>
								<Button
									variant="text"
									sx={{ mr: 2 }}
									onClick={() =>
										navigate("/developer/console")
									}
								>
									Cancel
								</Button>
								<Button
									variant="contained"
									onClick={handleUpdateApp}
								>
									Update Settings
								</Button>
							</Grid>
						</Grid>
					</Paper>
					{integration ? (
						<SectionCard
							title="Webflow Integration"
							expandable={false}
						>
							<Grid container spacing={{ md: 2, xs: 1 }}>
								<Grid item xs={3} sx={{ textAlign: "left" }}>
									{" "}
									<Typography variant="title">
										Site ID:
									</Typography>
								</Grid>
								<Grid item xs={9} sx={{ textAlign: "left" }}>
									{integration.settings.site_id}
								</Grid>
								<Grid item xs={3} sx={{ textAlign: "left" }}>
									{" "}
									<Typography variant="title">
										Display Name:
									</Typography>
								</Grid>
								<Grid item xs={9} sx={{ textAlign: "left" }}>
									{integration.settings.site_name}
								</Grid>
								<Grid item xs={3} sx={{ textAlign: "left" }}>
									{" "}
									<Typography variant="title">
										Short Name:
									</Typography>
								</Grid>
								<Grid item xs={9} sx={{ textAlign: "left" }}>
									{integration.settings.site_shortname}
								</Grid>
								<Grid item xs={3} sx={{ textAlign: "left" }}>
									{" "}
									<Typography variant="title">
										Login Button Page:
									</Typography>
								</Grid>
								<Grid item xs={9} sx={{ textAlign: "left" }}>
									{integration.settings.login_page}
								</Grid>
								<Grid item xs={12} sx={{ textAlign: "left" }}>
									<Typography variant="title">
										Protected Pages:
									</Typography>
								</Grid>
								<Grid container item xs={12}>
									<List dense={true}>
										{integration.settings.protected_pages.map(
											(page) => (
												<ListItem key={"pp" + page.id}>
													<ListItemIcon>
														<WebIcon />
													</ListItemIcon>
													<ListItemText
														primary={page.title}
														secondary={page.path}
													/>
												</ListItem>
											)
										)}
									</List>
								</Grid>
								<Grid item xs={12} sx={{ textAlign: "left" }}>
									<Button
										variant="outlined"
										sx={{ m: 2 }}
										onClick={() => setOpenPagesDialog(true)}
									>
										Update Protected Pages
									</Button>
								</Grid>

								<WebflowPagesDialog
									app={application}
									settings={integration?.settings}
									open={openPagesDialog}
									siteId={integration?.settings.site_id}
									protected={
										integration?.settings.protected_pages
									}
									handleClose={() => {
										setOpenPagesDialog(false);
									
									}}
								></WebflowPagesDialog>
							</Grid>
						</SectionCard>
					) : (

						<SectionCard
							title="Webflow Integration"
							expandable={false}
						>

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
							For Webflow integratoin, you can connect and integrate with your site here. 
						</Alert>

						</SectionCard>
					)}

					{ integration == null &&

					<SectionCard title="Quick Code Setup" expandable={false}>
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
					</SectionCard>
	}
					<WebflowIntegrationDialog
						open={openWebflow}
						app={application}
						source={webflow_custom_source}
						handleClose={() => {
							setOpenWebflow(false);
							getIntegration();
						}}
					></WebflowIntegrationDialog>
				</>
			)}
		</VaultBase>
	);
}
