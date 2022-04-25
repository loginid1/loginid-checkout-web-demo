import React, { useEffect, useState } from "react";
import { AuthService } from "../../services/auth";
import { useNavigate } from "react-router-dom";
import { Message, MessagingService } from "../../services/messaging";
import { EnableOpts } from "../../lib/common/api";
import vaultSDK from "../../lib/VaultSDK";
import { AccountList } from "../../lib/VaultSDK/vault/algo";
import { ThemeProvider } from "@emotion/react";
import { Home } from "@mui/icons-material";
import {
	Container,
	AppBar,
	Toolbar,
	IconButton,
	Typography,
	createTheme,
	Alert,
	Checkbox,
	FormControlLabel,
	Button,
	AlertColor,
} from "@mui/material";
import { DisplayMessage } from "../../lib/common/message";

interface WalletEnableSession {
	network: string;
	origin: string;
}

const theme = createTheme();
export default function WalletEnable() {
	const navigate = useNavigate();
	const [session, setSession] = useState<string | null>(null);
	const [enable, setEnable] = useState<WalletEnableSession | null>(null);
	const [accountList, setAccountList] = useState<AccountList | null>(null);
	const [displayMessage, setDisplayMessage] = useState<DisplayMessage | null>(null);

	useEffect(() => {
		let target = window.opener;
		if (target != null) {
			MessagingService.onMessage(target, (msg) => onMessageHandle(msg));
			window.addEventListener("unload", (ev) => {
				ev.preventDefault();
				MessagingService.sendMessage(target, {
					channel: MessagingService.channel,
					message: "window-closed",
				});
			});
			//MessagingService.windowLoadConfirmation(target);
			checkSession();
		} else {
			getAccountList();
			setDisplayMessage({text:"Missing dApp origin",type:"error"});
		}
	}, []);
	// check if user logged in
	// if not redirect to logi await new Promise(resolve => setTimeout(resolve, 1000));n
	async function checkSession() {
		await waitForEnableInput();
		const auth = AuthService.isLoggedIn();
		if (!auth) {
			const redirect_url =
				"/login?redirect_url=" + encodeURIComponent("/enable");
			navigate(redirect_url);
		}

		// check if enableSession
		if(sessionStorage.getItem("enableSession") != null) {
			getAccountList();
		} else {
			setDisplayMessage({text:"Missing request parameter",type:"error"});
		}
	}
	function onMessageHandle(msg: Message) {
		console.log("handle message");
		try {
			let enable: EnableOpts = JSON.parse(msg.message);
			// validate enable
			if(enable.network == null && enable.genesisHash == null){
				setDisplayMessage({text:"Require network type",type:"error"});
			} else {
				let enableSession : WalletEnableSession = {network: enable.network || "", origin: window.opener.loaction}
				sessionStorage.setItem("enableSession",JSON.stringify(enableSession))
				setEnable(enableSession);
			}
		} catch (error) {}
	}
	async function waitForEnableInput() {
		for (let i = 0; i < 5; i++) {
			if (enable == null) {
				await new Promise((resolve) => setTimeout(resolve, 1000));
			} else {
				return;
			}
		}
	}

	async function getAccountList() {
		const token = AuthService.getToken();
		if (token) {
			const accountList = await vaultSDK.getAccountList(token);
			console.log(accountList);
			setAccountList(accountList);
		} else {
		}
	}
	return (
		<ThemeProvider theme={theme}>
			<Container component="main" maxWidth="xs">
				<AppBar position="static">
					<Toolbar variant="dense">
						<Typography
							variant="h6"
							color="inherit"
							component="div"
						>
							Account Consent
						</Typography>
					</Toolbar>
				</AppBar>

				{displayMessage &&
				<Alert severity={displayMessage?.type as AlertColor || 'info'} sx={{mt: 4}}>{displayMessage.text}</Alert>
				}
				
				<Typography
					sx={{ m: 2 }}
					variant="body2"
					color="text.secondary"
					align="left"
				>
					dApp origin: {enable?.origin } <br />
					Network: {enable?.network } <br />
				</Typography>
				{accountList == null && <p>You have no account setup yet!</p>}

				{accountList?.accounts?.map((account) => (
					<FormControlLabel
						label={account.address}
						control={<Checkbox value={account.address} />}
					/>
				))}

				<Button fullWidth variant="contained" sx={{ mt: 1, mb: 1 }}>
					Allow
				</Button>
				<Button fullWidth variant="outlined" sx={{ mt: 1, mb: 1 }}>
					Cancel
				</Button>
			</Container>
		</ThemeProvider>
	);
}
