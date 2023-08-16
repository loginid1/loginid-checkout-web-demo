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
import { AppList, VaultApp } from "../../lib/VaultSDK/vault/developer";
import { WebflowDomain, WebflowSite } from "../../lib/VaultSDK/vault/webflow";
import { WebflowService } from "../../services/webflow";
import { KeyDisplay } from "../KeyDisplay";
import styles from "../../styles/common.module.css";
import { AuthService } from "../../services/auth";
import { DisplayMessage } from "../../lib/common/message";
import { ArrayUtil } from "../../lib/util/array";

interface WebflowQuickIntegrationProps extends DialogProps {
	appList: AppList | null;
	handleClose: () => void;
}

export enum WebflowDialogPage {
	Auth = "auth",
	Upload = "upload",
	Button = "button-design",
}

const wallet_url =
	process.env.REACT_APP_WALLET_URL || "https://wallet.loginid.io";
export function WebflowQuickIntegrationDialog(
	props: WebflowQuickIntegrationProps
) {
	const [step, setStep] = useState<number>(0);
	const [page, setPage] = useState<WebflowDialogPage>(WebflowDialogPage.Auth);
	const [wfToken, setWFToken] = useState<string>("");
	const [sites, setSites] = useState<WebflowSite[]>([]);
	const [selectedSite, setSelectedSite] = useState<string>("");
	const [displayMessage, setDisplayMessage] = useState<DisplayMessage | null>(
		null
	);

	useEffect(() => {
		// check if access token
		let access_token = WebflowService.getToken();
		if (access_token == null) {
			setPage(WebflowDialogPage.Auth);
		} else {
			getSites(access_token);
		}
	}, []);

	function siteSelection(event: React.ChangeEvent<HTMLInputElement>) {
		setSelectedSite(event.target.value);
		event.target.checked;
	}

	function updateSourceAppID(app_id: string): string {
		return `
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
	}

	async function handleConnectWebflow() {
		try {
			let response = await vaultSDK.getWebflowAuthorizeUrl();
			WebflowService.saveNavigation(
				window.location.pathname + "?webflow=true"
			);
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
			let wf_sites = await vaultSDK.getWebflowSites(token);
			setWFToken(token);
			setSites(wf_sites.sites);
			setPage(WebflowDialogPage.Upload);
		} catch (error) {
			// set error
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
				console.log("no site selected");
				return;
			}
			if (token) {
				for (const site of sites) {
					if (site.id == selectedSite) {
						// check if app haven't created yet
						if (searchAppExists(props.appList, site)) {
							setDisplayMessage({
								type: "error",
								text: "Webflow integration app is already existed!",
							});

							return;
						}
						let domain = `https://${site.shortName}.webflow.io`;
						if (site.customDomains.length > 0) {
							domain = site.customDomains[0].url;
						}
						const result = await vaultSDK.createApp(token, {
							app_name: site.displayName,
							origins: domain,
							attributes: "email",
							id: "",
							uat: "",
						});
						// update snippet
						let source = updateSourceAppID(result.id);

						uploadScript(site.id, source);
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

	function searchAppExists(apps: AppList | null, site: WebflowSite): boolean {
		if (apps != null) {
			for (const app of apps.apps) {
				if (app.app_name == site.displayName) {
					let domain = `https://${site.shortName}.webflow.io`;
					if (ArrayUtil.contains(app.origins.split(","), domain)) {
						return true;
					}
					if (
						site.customDomains.length > 0 &&
						ArrayUtil.contains(
							app.origins.split(","),
							site.customDomains[0].url
						)
					) {
						return true;
					}
				}
			}
		}
		return false;
	}

	async function uploadScript(siteid: string, source: string) {
		try {
			let response = await vaultSDK.uploadWebflowScript(
				wfToken,
				siteid,
				source
			);
			console.log(response);
			setPage(WebflowDialogPage.Button);
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
						Connect to your Webflow account in order to setup
						LoginID Wallet button to your site.
					</Typography>
				</DialogContent>
				<DialogActions sx={{ justifyContent: "center", mb: 2 }}>
					<Button variant="text" onClick={() => handleClose()}>
						Cancel
					</Button>

					<Button
						variant="contained"
						onClick={() => handleConnectWebflow()}
					>
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
						This will upload LoginID Wallet SDK scripts to your
						webflow site for quick integration.
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
					<Typography
						align="left"
						variant="body1"
						component="div"
						sx={{ p: 1 }}
					>
						<p>1. Drag and drop a button from Webflow Designer.</p>
						<p>
							2. Change button ID to <b>loginid-button</b>.
						</p>
						<p>
							3. Update navigation link when user successfully
							signed in or signed up.
						</p>
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

function SiteLabel(
	name: string,
	shortName: string,
	addresses: WebflowDomain[]
) {
	return (
		<Stack sx={{ justifyContent: "flex-start" }}>
			<Typography align="left" variant="subtitle1">
				{name}
			</Typography>
			<Typography align="left" variant="body2">
				{shortName}
			</Typography>
			{addresses.map((address) => {
				<Typography align="left" variant="caption">
					address.url
				</Typography>;
			})}
		</Stack>
	);
}
