import {
	Alert,
	Button,
	Checkbox,
	Chip,
	Divider,
	FormControl,
	FormControlLabel,
	FormGroup,
	IconButton,
	LinearProgress,
	Stack,
	Typography,
} from "@mui/material";
import { useContext, useState, useEffect, ChangeEvent } from "react";
import vaultSDK from "../../lib/VaultSDK";
import { ConsentPass } from "../../lib/VaultSDK/vault/federated";
import { AuthService } from "../../services/auth";
import { CodeInput } from "../CodeInput";
import AccountIcon from "@mui/icons-material/AccountCircle";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import {
	ConsentContextType,
	ConsentContext,
	AuthPage,
} from "../../lib/federated";
import { ContentCopy, Refresh } from "@mui/icons-material";
import { isDesktop } from "react-device-detect";
import DocumentPass from "../DocumentPass";
import { DriversLicensePass } from "../../lib/VaultSDK/vault/pass";

export function ErrorPage(props: { error: string }) {
	return (
		<>
			<Alert severity="error" sx={{ mt: 2 }}>
				{props.error}
			</Alert>
		</>
	);
}

export function Consent(props: { session: string; username: string }) {
	const { postMessageText, setPage, setDisplayMessage, handleCancel } =
		useContext<ConsentContextType | null>(
			ConsentContext
		) as ConsentContextType;
	const [appName, setAppName] = useState<string>("");
	const [checked, setChecked] = useState<string[]>([]);
	const [passes, setPasses] = useState<{[key: string]: ConsentPass[]}>({});
	const [load, setLoad] = useState<boolean>(false);

	useEffect(() => {
		checkConsent();
	}, []);

	async function checkConsent() {
		try {
			let consent = await vaultSDK.checkConsent(props.session);

			if (consent.passes !== null) {
				const passesGroupByType = consent.passes.reduce(
					(group: {[key: string]: ConsentPass[]}, product: ConsentPass) => {
						const { type } = product;
						group[type] = group[type] ?? [];
						group[type].push(product);
						return group;
					}, 
					{}
				);
				setPasses(passesGroupByType);
				setChecked(consent.passes.map(pass => pass.id));
			}
			setAppName(consent.app_name);
			if (
				consent.required_attributes == null ||
				consent.required_attributes.length === 0
			) {
				postMessageText(JSON.stringify({ token: consent.token }));
				setPage(AuthPage.FINAL);
			} else {
				if (consent.missing_attributes.length > 0) {
					if (consent.missing_attributes[0] === "phone") {
						setPage(AuthPage.PHONE_PASS);
					} else if (
						consent.missing_attributes[0] === "drivers-license"
					) {
						setPage(AuthPage.DRIVER_PASS);
					}
				} else {
					// load consent page
					setLoad(true);
				}
			}
		} catch (e) {
			console.log(e);
			setDisplayMessage({ type: "error", text: (e as Error).message });
		}
	}

	async function saveConsent() {
		try {
			let consent = await vaultSDK.saveConsent(props.session, checked);
			postMessageText(
				JSON.stringify({ token: consent.token, vcs: consent.vcs })
			);
			setPage(AuthPage.FINAL);
		} catch (e) {
			setDisplayMessage({ type: "error", text: (e as Error).message });
		}
	}

	const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
		var updatedList = [...checked];
		if (event.target.checked) {
			updatedList = [...checked, event.target.value];
		} else {
			updatedList.splice(checked.indexOf(event.target.value), 1);
		}
		setChecked(updatedList);
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
							{ Object.keys(passes).map(index => {
								return (
									<>
										<Typography textAlign="left"><b>{index.charAt(0).toUpperCase() + index.slice(1).replace('-', ' ')}:</b></Typography>
										<FormControl sx={{ mx: 3 }} component="fieldset" variant="standard">
											<FormGroup>
												{ passes[index].map(pass => 
													<FormControlLabel 
														key={pass.id}
														sx={{fontSize: 14}}
														control={
															<Checkbox 
																defaultChecked
																value={pass.id}
																size="small" 
																onChange={handleChange} 
															/>
														} 
														label={pass.data}
													/>
												)}
											</FormGroup>
										</FormControl>
									</>
								)
							})}
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

	const [verifyInit, setVerifyInit] = useState(false);
	const [timer, setTimer] = useState(45);

	useEffect(() => {
		timer > 0 && verifyInit && setTimeout(() => setTimer(timer - 1), 1000);
	}, [timer, verifyInit]);

	async function handleVerify() {
		const token = AuthService.getToken();
		if (token) {
			try {
				await vaultSDK.createPhonePassInit(token, "+" + phone);
				setShowCode(true);
				setVerifyInit(true);
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
			<Typography sx={{ m: 2 }} variant="body2">
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
					<Stack
						direction="row"
						justifyContent="center"
						alignItems="center"
					>
						<Typography variant="caption" color="text.secondary">
							resend code in <strong>{timer} seconds</strong>
						</Typography>
						<Button
							variant="text"
							size="small"
							startIcon={<Refresh />}
							disabled={verifyInit && timer !== 0}
							onClick={async () => {
								const token = AuthService.getToken();
								if (token) {
									try {
										setTimer(45);
										await vaultSDK.createPhonePassInit(
											token,
											"+" + phone
										);
										setVerifyInit(true);
									} catch (err) {
										console.error(err);
									}
								}
							}}
						>
							Resend
						</Button>
					</Stack>
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

let wsurl = process.env.REACT_APP_VAULT_WS_URL;

function DriversLicenseDesktopComponent(props: {
	session: string;
	username: string;
}) {
	const [link, setLink] = useState<string>("");
	const [qrCode, setQrCode] = useState<string>("");
	const [status, setStatus] = useState<string>("init");
	const { postMessageText, setPage, setDisplayMessage, handleCancel } =
		useContext<ConsentContextType | null>(
			ConsentContext
		) as ConsentContextType;

	useEffect(() => {
		const token = AuthService.getToken();
		const getSession = async () => {
			const data = await vaultSDK.driversLicenseMobileInit(
				token,
				"Driver License",
				"drivers-license"
			);
			setLink(data.link);
			setQrCode(data.qr_code);

			let ws = new WebSocket(
				wsurl +
					"/api/passes/drivers-license/mobile/ws/" +
					data.session_id
			);
			// Only render the Link and QR code if the WS is open
			// ws.onopen = (event) => {
			//     console.log("On Open: ", event)
			// };

			// Check for a success message, otherwise retry the DocV and Livness (at least 3 times)
			ws.onmessage = (event) => {
				if (event.data === "session.success") {
					setPage(AuthPage.CONSENT);
				} else if (event.data === "session.begin") {
					setStatus("scanning");
				} else if (event.data === "session.cancel") {
					setStatus("cancel");
				}
			};

			// Retry the connection if the WS closes
			// ws.onclose = (event) => {
			//     console.log("On Close: ", event)
			// };
		};
		getSession();
	}, []);

	return (
		<>
			{status === "init" && (
				<>
					<Typography
						variant="caption"
						color="text.secondary"
						align="left"
					>
						Verify that government IDs are authentic and valid.
					</Typography>
					<Typography variant="caption" color="primary">
						Ready your mobile device:{" "}
					</Typography>
					<img src={qrCode} alt="Add Drivers License" />
					<Typography variant="caption" color="primary">
						{" "}
						Or using the following link:{" "}
					</Typography>
					<Stack
						direction="row"
						justifyContent="center"
						alignItems="center"
					>
						<Chip label={link} size="small"></Chip>
						<IconButton
							size="small"
							onClick={() => {
								navigator.clipboard.writeText(link);
							}}
						>
							<ContentCopy />
						</IconButton>
					</Stack>
				</>
			)}

			{status === "scanning" && (
				<>
					<LinearProgress />
					<Typography
						variant="caption"
						sx={{ mt: 1, mb: 1 }}
						color="text.secondary"
						align="left"
					>
						Follow the instructions from you mobile device to
						complete the verification process.
					</Typography>

					<Typography
						variant="caption"
						color="text.secondary"
						align="left"
					>
						{" "}
						1. Scan your driver license{" "}
					</Typography>
					<Typography
						sx={{ mb: 2 }}
						variant="caption"
						color="text.secondary"
						align="left"
					>
						{" "}
						2. Match your ID with liveness detection{" "}
					</Typography>
				</>
			)}

			{status === "cancel" && (
				<>
					<Typography
						variant="caption"
						sx={{ mt: 1, mb: 1 }}
						color="text.secondary"
						align="left"
					>
                        You have canceled the document verification process.
					</Typography>

				</>
			)}
		</>
	);
}

export function DriverLicensePassPage(props: {
	session: string;
	username: string;
}) {
	const [pass, setPass] = useState<DriversLicensePass | null>(null);
	const [token, setToken] = useState<string>("");
	const [credentialId, setCredentialId] = useState<string>("");
	const authToken = AuthService.getToken() as string;
	const { postMessageText, setPage, setDisplayMessage, handleCancel } =
		useContext<ConsentContextType | null>(
			ConsentContext
		) as ConsentContextType;

	if (isDesktop) {
		return (
			<Stack>
				<Typography sx={{ m: 2 }} variant="body2">
					Add a Driver License
				</Typography>
				<DriversLicenseDesktopComponent {...props} />
			</Stack>
		);
	}

	const handleSuccess = async () => {
		if (authToken && pass) {
			try {
				await vaultSDK.createDriversLicensePass(
					authToken,
					"Driver License",
					credentialId,
					token,
					pass
				);
				setPage(AuthPage.CONSENT);
			} catch (err) {
				console.error(err);
				handleCancel();
			}
		}
	};

	return (
		<DocumentPass
			token={token}
			credentialId={credentialId}
			authToken={AuthService.getToken() as string}
			handleCancel={() => {
				handleCancel();
			}}
			handleSuccess={handleSuccess}
			passName="Driver License"
			passType="drivers-license"
			setPass={setPass}
			setToken={setToken}
			setCredentialId={setCredentialId}
		/>
	);
}
