import { ContentCopy } from "@mui/icons-material";
import {
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
import { VaultApp } from "../../lib/VaultSDK/vault/developer";
import { WebflowDomain, WebflowSite } from "../../lib/VaultSDK/vault/webflow";
import { WebflowService } from "../../services/webflow";
import { KeyDisplay } from "../KeyDisplay";
import styles from "../../styles/common.module.css";

interface WebflowIntegrationProps extends DialogProps {
	app: VaultApp;
	source: string;
	handleClose: () => void;
}

export enum WebflowDialogPage {
	Auth = "auth",
	Upload = "upload",
	Button = "button-design"
}

export function WebflowIntegrationDialog(props: WebflowIntegrationProps) {
	const [step, setStep] = useState<number>(0);
	const [page, setPage] = useState<WebflowDialogPage> (WebflowDialogPage.Auth);
	const [token, setToken] = useState<string>("");
	const [sites, setSites] = useState<WebflowSite[]>([]);
	const [selectedSite, setSelectedSite] = useState<string>("");

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
				/*
				setDisplayMessage({
					type: "error",
					text: (error as Error).message,
				});
				*/
			}
	}

	async function getSites(token: string) {
		try {
			console.log("get sites");
			let wf_sites = await vaultSDK.getWebflowSites(token);
			console.log("set sites");
			setToken(token);
			setSites(wf_sites.sites);
			setPage(WebflowDialogPage.Upload);
		} catch (error) {
			// set error
			setPage(WebflowDialogPage.Auth); 
		}
	}

	async function uploadScript() {

		try {
			let response = await vaultSDK.uploadWebflowScript(token, selectedSite,props.source);
			console.log(response);
			setPage(WebflowDialogPage.Button);	
		} catch(error) {
			/*
			setDisplayMessage({
				type: "error",
				text: (error as Error).message,
			});
			*/
		}
	}


	function handleClose() {
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
					<Button variant="contained" onClick={() => uploadScript()}>
						Upload
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

					<Button variant="contained" onClick={() => handleClose()}>
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