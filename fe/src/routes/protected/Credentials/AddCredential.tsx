import {
	Button,
	Chip,
	Dialog,
	DialogContentText,
	IconButton,
	Link,
	Paper,
	Stack,
	TextField,
	Typography,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthService } from "../../../services/auth";
import AddImg from "../../../assets/AddCredential.png";
import { ArrowBack, ContentCopy, InfoOutlined } from "@mui/icons-material";
import vaultSDK from "../../../lib/VaultSDK";
import { VaultBase } from "../../../components/VaultBase";
import { HtmlTooltip } from "../../../components/HtmlTooltip";

const AddCredential: React.FC = () => {
	const navigate = useNavigate();

	const [credentialCode, setCredentialCode] = useState("");
	const [credentialName, setCredentialName] = useState("");
	const [isCodeGenerated, setIsCodeGenerated] = useState(false);
	const [errorMessage, setErrorMessage] = useState("");
	const [openCredential, setOpenCredential] = useState(false);


	const [link, setLink] = useState<string>("");
	const [qrcode, setQrcode] = useState<string>("");

	useEffect(()=>{
		getCodeLink();
	},[]);

	async function getCodeLink() {

		const token = AuthService.getToken();
		try {

		if (token) {
			const response = await vaultSDK.getCodeLink(token);
			setQrcode(response.qr_code);
			setLink(response.link)

		} else {
			// display error here
			setIsCodeGenerated(true);

		}
	} catch (e) {
		// TODO: display error message
		setIsCodeGenerated(true);
	}

	}

	async function generateCredentialCode(): Promise<string | null> {
		const token = AuthService.getToken();
		if (token) {
			const response = await vaultSDK.generateCredentialCode(token);
			return response.code;
		}
		return null;
	}

	const handleClickOpenCredential = async () => {
		const code = await generateCredentialCode();
		if (code != null) {
			setCredentialCode(code);
			setOpenCredential(true);
		}
	};

	const handleCloseCredential = () => {
		setOpenCredential(false);
		setIsCodeGenerated(true);
		navigate("/credential");
	};

	const handleRestartCredential = () => {
		setIsCodeGenerated(false);
		setCredentialCode("");
		setCredentialName("");
	};

	const handleCompleteCredential = () => {
		navigate("/credential");
	};
	
	const copyLink = () => {
		navigator.clipboard.writeText(link);
	};

	return (
		<VaultBase focus={"passkeys"}>
			<Paper
				elevation={0}
				sx={{
					p: { md: 4, xs: 2 },
					display: "flex",
					justifyContent: "center",
				}}
			>
				{!isCodeGenerated ? (
					<Stack
						spacing={{ md: 2, xs: 1 }}
						direction="column"
						maxWidth="400px"
						alignItems={"center"}
					>
						<Stack direction="row" spacing={1}>
							<Typography variant="h2" color="secondary">
								Add New Passkey
							</Typography>
							<HtmlTooltip
								title={
									<Stack>
										<Typography variant="body2">
											A registration code is a 6 digit
											code that will help you link a new
											device to your account.
										</Typography>
										<Link variant="body2" color="inherit">
											Learn more about registration codes.
										</Link>
									</Stack>
								}
								arrow
							>
								<InfoOutlined color="secondary"></InfoOutlined>
							</HtmlTooltip>
						</Stack>
						<Typography variant="body2" color="text.secondary">
							Passkeys are a combination of browsers and
							devices used to give you access to your account. A
							Registration Code is a 6-digit code that will allow
							you to register a new credential with this account.
						</Typography>

						<Typography variant="body1" color="primary" >Go to following link on your new device: </Typography>
						<Stack direction="row">
						<Chip label={link}></Chip>
									<IconButton
										size="small"
										onClick={copyLink}
									>
										<ContentCopy />
									</IconButton>
						</Stack>
						<Typography variant="body1" color="primary">or use following QR code: </Typography>
						
						<img src={qrcode} alt="Add Credential" />

						<Typography variant="body1">
							When you have your other device ready, select Get
							Registration Code.
						</Typography>
						<Stack direction="row" spacing={2}>
							<Button onClick={() => navigate("/home")}>
								<ArrowBack />
								&nbsp;Back
							</Button>
							<Button
								variant="contained"
								color="primary"
								onClick={handleClickOpenCredential}
							>
								Get Registration Code
							</Button>
						</Stack>
					</Stack>
				) : (
					<Stack spacing={6}>
						<Typography variant="h2" color="secondary">
							Name New Credential
						</Typography>
						<TextField
							label="Credential name"
							onChange={(e) => setCredentialName(e.target.value)}
							focused
						/>
						<Stack direction="row" spacing={2}>
							<Button onClick={handleRestartCredential}>
								<ArrowBack />
								&nbsp;Back
							</Button>
							<Button
								color="primary"
								onClick={handleCompleteCredential}
							>
								Next
							</Button>
						</Stack>
					</Stack>
				)}

				<Dialog
					open={openCredential}
					onClose={handleCloseCredential}
					aria-labelledby="alert-dialog-title"
					aria-describedby="alert-dialog-description"
					sx={{
						p: 4,
						display: "flex",
						justifyContent: "center",
					}}
				>
					<Stack
						spacing={2}
						sx={{
							alignItems: "center",
							p: 6,
							width: "400px",
						}}
					>
						<Typography
							variant="h2"
							color="secondary"
							id="alert-dialog-title"
						>
							Your Registration Code
						</Typography>
						<Typography
							variant="body1"
							id="alert-dialog-description"
							textAlign="center"
						>
							Enter this 6-digit code on your other device in
							order to add it to Your Credentials.
						</Typography>
						<Typography variant="h2" color="primary">
							{credentialCode}
						</Typography>
						<DialogContentText>
							This code will expire in 5 minutes
						</DialogContentText>

						<Button
							variant="contained"
							color="primary"
							onClick={handleCloseCredential}
						>
							Close
						</Button>
					</Stack>
				</Dialog>
			</Paper>
		</VaultBase>
	);
};

export default AddCredential;
