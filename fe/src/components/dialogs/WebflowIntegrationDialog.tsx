import { ContentCopy } from "@mui/icons-material";
import {
	Alert,
	AlertColor,
	Box,
	Button,
	Checkbox,
	Dialog,
	DialogActions,
	DialogContent,
	DialogProps,
	FormControlLabel,
	Radio,
	Stack,
	Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import vaultSDK from "../../lib/VaultSDK";
import { VaultApp, WebflowSettings } from "../../lib/VaultSDK/vault/developer";
import { WebflowDomain, WebflowPage, WebflowSite } from "../../lib/VaultSDK/vault/webflow";
import { WebflowService } from "../../services/webflow";
import { KeyDisplay } from "../KeyDisplay";
import styles from "../../styles/common.module.css";
import { DisplayMessage } from "../../lib/common/message";
import { AuthService } from "../../services/auth";
import { WebflowAddPagesIntegration } from "../WebflowAddPageIntegration";
import { useNavigate } from "react-router-dom";

interface WebflowIntegrationProps extends DialogProps {
	app: VaultApp;
	source: string;
	handleClose: () => void;
}

export enum WebflowDialogPage {
	Auth = "auth",
	Upload = "upload",
	Button = "button-design",
	Member = "member",
}

const wallet_url = process.env.REACT_APP_WALLET_URL || "https://wallet.loginid.io";
export function WebflowIntegrationDialog(props: WebflowIntegrationProps) {
	const [step, setStep] = useState<number>(0);
	const [page, setPage] = useState<WebflowDialogPage> (WebflowDialogPage.Auth);
	const [wfToken, setWfToken] = useState<string>("");
	const [sites, setSites] = useState<WebflowSite[]>([]);
	const [selectedSite, setSelectedSite] = useState<string>("");
	const [displayMessage, setDisplayMessage] = useState<DisplayMessage | null>( null);
	const [settings, setSettings] = useState<WebflowSettings | null>(null);
	const [pages, setPages] = useState<WebflowPage[]>([]);
	const navigate=useNavigate();

	useEffect(()=> {
		// check if access token
		let access_token = WebflowService.getToken();
		if (access_token == null) {
			setPage(WebflowDialogPage.Auth); 
		} else {
			getSites(access_token);
		}

	},[]);

	function siteSelection(event: React.ChangeEvent<HTMLInputElement>) {
		setSelectedSite(event.target.value);
		event.target.checked;
	}


	async function handleConnectWebflow(){

			try {
				let response = await vaultSDK.getWebflowAuthorizeUrl();
				WebflowService.saveNavigation(window.location.pathname + "?webflow=true");
				window.location.assign(response.url);
			} catch (error) {
				setDisplayMessage({
					type: "error",
					text: (error as Error).message,
				});
			}
	}

	async function getSites(token: string) {
		try {
			let wf_sites = await vaultSDK.getWebflowSites(token);
			setWfToken(token);
			setSites(wf_sites.sites);
			setPage(WebflowDialogPage.Upload);
		} catch (error) {
			// set error
			console.log(error);
			setPage(WebflowDialogPage.Auth); 
		}
	}

	async function integrateApp() {
		try {
			const token = AuthService.getToken();
			if (selectedSite === "") {
				setDisplayMessage({
					type: "error",
					text: "Please select a Webflow site to integrate!",
				});
				//console.log("no site selected");
				return;
			}
			if (token) {
				for (const site of sites) {
					if (site.id == selectedSite) {
						// check if app haven't created yet
						// update snippet
						const settings = {site_id: site.id, site_name: site.displayName, site_shortname: site.shortName, login_page:"/", protected_pages:[]};
						const i_result = await vaultSDK.setupWebflowIntegration(token, props.app.id, settings, wfToken );						

						const wfPages = await vaultSDK.getWebflowPages(
							wfToken,
							site.id
						);
						setSettings(i_result.settings);
						setPages(wfPages.pages);

						setPage(WebflowDialogPage.Member);
						//let source = updateSourceAppID(props.app.id);
						//uploadScript(site.id, props.app.id);
						break;
					}
				}
			}
		} catch (error) {
			setDisplayMessage({
				type: "error",
				text: (error as Error).message,
			});
		}
	}


	function handleClose() {
		props.handleClose();
	}

	function handleComplete() {
		navigate("/developer/app/" + props.app.id);
		props.handleClose();
	}

	function copy(text: string) {
		navigator.clipboard.writeText(text);
	}
	return (
		<Dialog open={props.open} maxWidth="xs" fullWidth>
			<DisplayContent />
		</Dialog>
	);

	function DisplayContent() {
		switch (page) {
			case WebflowDialogPage.Auth:
				return <DisplayAuth />;
			case WebflowDialogPage.Upload:
				return <DisplayUpload />;
			case WebflowDialogPage.Button:
				return <DisplayButton />;
			case WebflowDialogPage.Member:
				if (settings != null) {
					return (
						<WebflowAddPagesIntegration
							app={props.app}
							settings={settings}
							pages={pages}
							webflowToken={wfToken}
							handleSkip = {()=>{setPage(WebflowDialogPage.Button);}}
							handleComplete={() => {
								setPage(WebflowDialogPage.Button);
							}}
						></WebflowAddPagesIntegration>
					);
				} else {
					return <DisplayButton />;
				}
			default:
				return <DisplayAuth></DisplayAuth>;
		}
	}

	function DisplayAuth() {
		return (
			<>
				<DialogContent>
					<Typography align="center" variant="h2" color="secondary">
						Link to your Webflow account!
					</Typography>
					<Typography align="center" variant="body1" sx={{ p: 2 }}>
						Connect to your Webflow account in order to setup LoginID Wallet button to your site.
					</Typography>
				</DialogContent>
				<DialogActions sx={{ justifyContent: "center", mb: 2 }}>
					<Button variant="text" onClick={() => handleClose()}>
						Cancel	
					</Button>

					<Button variant="contained" onClick={() => handleConnectWebflow()}>
						Connect	
					</Button>
				</DialogActions>
			</>
		);
	}
	function DisplayUpload() {
		return (
			<>
				<DialogContent>
					<Typography align="center" variant="h2" color="secondary">
						Webflow Integration!
					</Typography>

					{displayMessage && (
						<Alert
							severity={
								(displayMessage?.type as AlertColor) || "info"
							}
						>
							{displayMessage.text}
						</Alert>
					)}
					
					<Typography align="center" variant="body1" sx={{ p: 2 }}>
						Select a site to integrate:
					</Typography>

				{sites?.map((site) => (
					<Box className={styles.formControl}>
						<FormControlLabel
							sx={{ width: "80%", m: 1 }}
							className={styles.formControl}
							label={SiteLabel(
								site.displayName,
								site.shortName,
								site.customDomains
							)}
							control={
								<Radio
									checked={selectedSite === site.id}
									id={site.id}
									value={site.id}
									onChange={siteSelection}
								/>
							}
						/>
					</Box>
				))}


					<Typography align="left" variant="caption" sx={{ p: 2 }}>
						Upload LoginID Wallet SDK scripts to your webflow site for quick integration.
					</Typography>
				</DialogContent>
				<DialogActions sx={{ justifyContent: "center", mb: 2 }}>

					<Button variant="text" onClick={() => handleClose()}>
						Cancel	
					</Button>
					<Button variant="contained" onClick={() => integrateApp()}>
						Integrate
					</Button>
				</DialogActions>
			</>
		);
	}
	function DisplayButton() {
		return (
			<>
				<DialogContent>
					<Typography align="center" variant="h2" color="secondary">
						Add LoginID Button Using Webflow Designer
					</Typography>
					<Typography align="left" variant="body1" component="div" sx={{ p: 1 }}>
						<p>1. Drag and drop a button from Webflow Designer.</p>
						<p>2. Change button ID to <b>loginid-button</b>.</p>
						<p>3. Update navigation link when user successfully signed in or signed up.</p>
					</Typography>
					<Box
						component="img"
						alignItems="center"
						src="/webflow/webflow-designer-button.png"
						sx={{ width: "90%" }}
					/>
					<Typography align="left" variant="body1" sx={{ p: 2 }}>
						4. Publish and test your site.
					</Typography>
				</DialogContent>
				<DialogActions sx={{ justifyContent: "center", mb: 2 }}>

					<Button variant="contained" onClick={() => handleComplete()}>
						Setup Complete	
					</Button>
				</DialogActions>
			</>
		);
	}

}

function SiteLabel(name: string, shortName: string, addresses: WebflowDomain[]) {
	return (
		<Stack sx={{ justifyContent: "flex-start" }}>
			<Typography align="left" variant="subtitle1">
				{name}
			</Typography>
			<Typography align="left" variant="body2">
				{shortName}
			</Typography>
			{addresses.map( (address) => {

			<Typography align="left" variant="caption">
				address.url	
			</Typography>
			})}
		</Stack>
	);
}