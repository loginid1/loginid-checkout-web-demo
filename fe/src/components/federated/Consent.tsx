import { Alert, AlertColor, Avatar, Button, Chip, Divider, List, ListItem, ListItemAvatar, ListItemText, Stack, Typography } from "@mui/material";
import { useContext, useState, useEffect } from "react";
import vaultSDK from "../../lib/VaultSDK";
import { ConsentPass } from "../../lib/VaultSDK/vault/federated";
import { AuthService } from "../../services/auth";
import { CodeInput } from "../CodeInput";
import { Message, MessagingService } from "../../services/messaging";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import AccountIcon from "@mui/icons-material/AccountCircle";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import jwt_decode from "jwt-decode";
import { ConsentContextType, ConsentContext, AuthPage } from "../../lib/federated";
import { PassIcon } from "./Icons";

export function ErrorPage(props: { error: string }) {
	return (
		<>
			<Alert severity="error" sx={{ mt: 2 }}>
				{props.error}
			</Alert>
		</>
	);
}

export function Consent(props: {  session: string; username: string }) {
	const { postMessageText,  setPage, setDisplayMessage, handleCancel } =
		useContext<ConsentContextType | null>(
			ConsentContext
		) as ConsentContextType;
	const [appName, setAppName] = useState<string>("");
	const [passes, setPasses] = useState<ConsentPass[]>([]);
	const [load, setLoad] = useState<boolean>(false);
	useEffect(() => {
		checkConsent();
	}, []);

	async function checkConsent() {
		try {
			let consent = await vaultSDK.checkConsent(props.session);
			console.log(consent);
			setPasses(consent.passes);
			setAppName(consent.app_name);
			if (
				consent.required_attributes == null ||
				consent.required_attributes.length === 0
			) {
				postMessageText(JSON.stringify({token:consent.token}));
				setPage(AuthPage.FINAL);
			} else {
				if (consent.missing_attributes.length > 0) {
					if (consent.missing_attributes[0] === "phone") {
						setPage(AuthPage.PHONE_PASS);
					}
				} else {
					// load consent page
					setLoad(true);
				}
			}
		} catch (e) {
            console.log(e);
			setDisplayMessage({ type: "error", text: (e as Error).message });
			setPage(AuthPage.ERROR);
		}
	}

	async function saveConsent() {
		//console.log("save consent");
		let consent = await vaultSDK.saveConsent(props.session);
		//console.log(consent.token);
		postMessageText(JSON.stringify({token:consent.token, vcs:consent.vcs}));
		setPage(AuthPage.FINAL);
	}

	if (load) {
		return (
			<Stack>
				<Typography
					sx={{ m: 1 }}
					variant="body1"
					color="text.secondary"
				>
					You have successfully logged in as:
				</Typography>
				<Chip
					icon={<AccountIcon />}
					label={props.username}
					sx={{ mb: 2 }}
				></Chip>
				<Divider variant="fullWidth" />
				{passes && (
					<>
						<Typography
							sx={{ m: 1 }}
							variant="body2"
							color="text.secondary"
						>
							Do you consent on sharing the following information
							with <strong>{appName}</strong>?
						</Typography>
						<Stack direction="column" justifyContent="center">
							{passes?.map((pass) => (
								<List
                                    key={pass.type}
									dense={true}
									sx={{
										width: "100%",
										maxWidth: 300,
										bgcolor: "background.paper",
									}}
								>
									<ListItem>
										<ListItemAvatar>
											<Avatar>
												<PassIcon type={pass.type} />
											</Avatar>
										</ListItemAvatar>
										<ListItemText primary={pass.data} />
									</ListItem>
								</List>
							))}
						</Stack>
						<Button
							fullWidth
							variant="contained"
							onClick={saveConsent}
							size="small"
							sx={{ mt: 2, mb: 1 }}
						>
							Confirm
						</Button>
					</>
				)}
				<Button
					variant="text"
					size="small"
					onClick={handleCancel}
					sx={{ mt: 0, mb: 2 }}
				>
					Close
				</Button>
			</Stack>
		);
	} else {
		return <></>;
	}
}

export function PhonePassPage(props: { session: string; username: string }) {
	const [phone, setPhone] = useState<string>("");
	const [showCode, setShowCode] = useState<boolean>(false);
	const [allowConfirm, setAllowConfirm] = useState<boolean>(false);
	const [code, setCode] = useState<string>("");
	const [error, setError] = useState<string | null>(null);
	const { postMessageText, setPage, setDisplayMessage, handleCancel } =
		useContext<ConsentContextType | null>(
			ConsentContext
		) as ConsentContextType;

	async function handleVerify() {
		const token = AuthService.getToken();
		if (token) {
			try {
				await vaultSDK.createPhonePassInit(token, "+" + phone);
				setShowCode(true);
			} catch (err) {
				setError((err as Error).message);
				console.error(err);
			}
		}
	}

	async function handleConfirm() {
		const token = AuthService.getToken();
		if (token) {
			try {
				console.log(phone);
				await vaultSDK.createPhonePassComplete(
					token,
					"My Phone",
					"+" + phone,
					code
				);
				setPage(AuthPage.CONSENT);
			} catch (err) {
				setError((err as Error).message);
				console.error(err);
			}
		}
	}
	function validateCode(value: string) {
		let pattern = new RegExp("^[0-9]+$|^$");
		if (pattern.test(value)) {
			setCode(value);
			if (value.length === 6) {
				setAllowConfirm(true);
			} else {
				setAllowConfirm(false);
			}
		}
	}
	return (
		<Stack>
			<Typography sx={{ m: 2 }} variant="body2" color="text.secondary">
				Add a phone number
			</Typography>
			{error && <Alert severity="error">{error}</Alert>}
			<Stack direction="row" sx={{ mt: 2, mb: 1 }}>
				<PhoneInput
					inputStyle={{
						width: "100%",
						height: "35px",
						fontSize: "13px",
						borderRadius: "5px",
					}}
					enableLongNumbers
					country={"us"}
					value={phone}
					onChange={(value) => setPhone(value)}
				/>
			</Stack>
			{showCode && (
				<>
					<Typography
						sx={{ m: 1 }}
						variant="caption"
						color="text.secondary"
					>
						Enter code received from your phone
					</Typography>
					<CodeInput
						inputName="code"
						validateCode={validateCode}
					></CodeInput>
				</>
			)}

			{showCode == false && (
				<Button
					fullWidth
					variant="contained"
					size="small"
					sx={{ mt: 1, mb: 1 }}
					onClick={handleVerify}
				>
					Verify Number
				</Button>
			)}
			{showCode && (
				<Button
					fullWidth
					variant="contained"
					size="small"
					sx={{ mt: 1, mb: 1 }}
					disabled={!allowConfirm}
					onClick={handleConfirm}
				>
					Confirm
				</Button>
			)}
			<Button
				variant="text"
				size="small"
				onClick={handleCancel}
				sx={{ mt: 1, mb: 1 }}
			>
				Close
			</Button>
		</Stack>
	);
}
