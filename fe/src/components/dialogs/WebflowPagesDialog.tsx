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
import {
	WebflowDomain,
	WebflowPage,
	WebflowSite,
} from "../../lib/VaultSDK/vault/webflow";
import { WebflowService } from "../../services/webflow";
import { KeyDisplay } from "../KeyDisplay";
import styles from "../../styles/common.module.css";
import { DisplayMessage } from "../../lib/common/message";
import { AuthService } from "../../services/auth";
import { WebflowAddPagesIntegration } from "../WebflowAddPageIntegration";

interface WebflowPagesDialogProps extends DialogProps {
	app: VaultApp;
	siteId: string;
	protected: WebflowPage[];
	settings: WebflowSettings;
	handleClose: () => void;
}

export enum WebflowDialogPage {
	Auth = "auth",
	Page = "page",
}

const wallet_url =
	process.env.REACT_APP_WALLET_URL || "https://wallet.loginid.io";
export function WebflowPagesDialog(props: WebflowPagesDialogProps) {
	const [page, setPage] = useState<WebflowDialogPage>(WebflowDialogPage.Page);
	const [token, setToken] = useState<string>("");
	const [pages, setPages] = useState<WebflowPage[]>([]);
	const [displayMessage, setDisplayMessage] = useState<DisplayMessage | null>(
		null
	);

	useEffect(() => {
		// check if access token
		let access_token = WebflowService.getToken();
		if (access_token == null) {
			setPage(WebflowDialogPage.Auth);
		} else {
			getPages(access_token, props.siteId);
		}
	}, []);

	async function handleConnectWebflow() {
		try {
			let response = await vaultSDK.getWebflowAuthorizeUrl();
			WebflowService.saveNavigation(window.location.pathname);
			window.location.assign(response.url);
		} catch (error) {
			setDisplayMessage({
				type: "error",
				text: (error as Error).message,
			});
		}
	}

	async function getPages(token: string, siteId: string) {
		try {
			let wf_pages = await vaultSDK.getWebflowPages(token, siteId);
			setToken(token);
			console.log(wf_pages);
			setPages(wf_pages.pages);
			setPage(WebflowDialogPage.Page);
		} catch (error) {
			// set error
			console.log(error);
			setPage(WebflowDialogPage.Auth);
		}
	}

	function handleClose() {
		props.handleClose();
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
			case WebflowDialogPage.Page:
				return <WebflowAddPagesIntegration
				app={props.app} settings={props.settings} pages={pages} webflowToken={token} handleCancel={props.handleClose}
				handleComplete={props.handleClose}
				></WebflowAddPagesIntegration>
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
}
