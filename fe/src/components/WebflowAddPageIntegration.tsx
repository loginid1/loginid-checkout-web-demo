import {
	DialogContent,
	Typography,
	Alert,
	AlertColor,
	Box,
	FormControlLabel,
	Checkbox,
	DialogActions,
	Button,
	Stack,
} from "@mui/material";
import { useEffect, useState } from "react";
import { DisplayMessage } from "../lib/common/message";
import vaultSDK from "../lib/VaultSDK";
import { VaultApp, WebflowSettings } from "../lib/VaultSDK/vault/developer";
import { WebflowPage } from "../lib/VaultSDK/vault/webflow";
import { AuthService } from "../services/auth";
import styles from "../styles/common.module.css";

export interface WebflowAddPagesIntegrationProps {
	app: VaultApp;
	settings: WebflowSettings;
	pages: WebflowPage[];
	webflowToken: string;
	handleComplete: () => void;
	handleCancel?: () => void;
	handleSkip?: () => void;
}

export function WebflowAddPagesIntegration(
	props: WebflowAddPagesIntegrationProps
) {
	const [displayMessage, setDisplayMessage] = useState<DisplayMessage | null>(
		null
	);
	const [selectedPages, setSelectedPages] = useState<string[]>([]);

	useEffect(() => {
		let selPageId = [];
		for (let p of props.settings.protected_pages) {
			selPageId.push(p.id);
		}
		setSelectedPages(selPageId);
	}, []);

	async function updateIntegration() {
		try {
			const authtoken = AuthService.getToken();
			if (authtoken) {
				// get list of page
				let settings = props.settings;
				const protectedPages = buildPages(props.pages, selectedPages);
				settings.protected_pages = protectedPages;
				await vaultSDK.updateWebflowIntegration(
					authtoken,
					props.app.id,
					settings,
					props.webflowToken
				);
				props.handleComplete();
			}
		} catch (error) {
			setDisplayMessage({
				type: "error",
				text: (error as Error).message,
			});
		}
	}

	return (
		<>
			<DialogContent>
				<Typography align="center" variant="h2" color="secondary">
					Page Access Control
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

				<Typography align="left" variant="body1" color="primary" sx={{ p: 2 }}>
					Select the pages with members access only:
				</Typography>

				{props.pages?.map((page) => (
					<Box sx={{ postion: "absolute" }} key={"form" + page.id}>
						<FormControlLabel
							className={styles.formControl}
							label={PageLabel(page.title, page.path)}
							control={
								<Checkbox
									sx={{ postion: "sticky" }}
									value={page.id}
									disabled={
										props.settings.login_page === page.path
									}
									checked={selectedPages.includes(page.id)}
									onChange={onPageSelection}
								/>
							}
						/>
					</Box>
				))}
			</DialogContent>
			<DialogActions sx={{ justifyContent: "center", mb: 2 }}>
				{props.handleSkip && (
					<Button variant="text" onClick={props.handleSkip}>
						Skip For Now	
					</Button>
				)}
				{props.handleCancel && (
					<Button variant="text" onClick={props.handleCancel}>
						Cancel
					</Button>
				)}
				<Button variant="contained" onClick={() => updateIntegration()}>
					Update Access Control	
				</Button>
			</DialogActions>
		</>
	);

	function buildPages(
		wfPages: WebflowPage[],
		selectedIds: string[]
	): WebflowPage[] {
		var selPages: WebflowPage[] = [];
		for (let id of selectedIds) {
			let selPage = getPageById(wfPages, id);
			if (selPage) {
				selPages.push(selPage);
			}
		}

		return selPages;
	}
	function getPageById(
		wfPages: WebflowPage[],
		id: string
	): WebflowPage | null {
		for (let page of wfPages) {
			if (page.id === id) {
				return page;
			}
		}
		return null;
	}

	function onPageSelection(event: React.ChangeEvent<HTMLInputElement>) {
		//event.preventDefault();
		let oldList = selectedPages;
		if (event.target.checked) {
			setSelectedPages((oldList) => [...oldList, event.target.value]);
			//console.log(id, checked, selectedPages);
		} else {
			oldList = oldList.filter((item) => item !== event.target.value);
			setSelectedPages(oldList);
		}
	}
}

function PageLabel(name: string, path: string) {
	return (
		<Stack sx={{ justifyContent: "flex-start" }}>
			<Typography align="left" variant="subtitle1">
				{name} ({path})
			</Typography>
		</Stack>
	);
}
