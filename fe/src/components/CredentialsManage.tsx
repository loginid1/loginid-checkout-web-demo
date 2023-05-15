import { Add, InfoOutlined } from "@mui/icons-material";
import {
	alpha,
	Box,
	Button,
	Card,
	CardContent,
	Grid,
	IconButton,
	Link,
	Paper,
	Stack,
	Typography,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import vaultSDK from "../lib/VaultSDK";
import { Credentials } from "../lib/VaultSDK/vault/user";
import { AuthService } from "../services/auth";
import { CredentialCards } from "./CredentialCard";
import { HtmlTooltip } from "./HtmlTooltip";

export const CredentialsManage: React.FC = () => {
	const navigate = useNavigate();

	const [credentials, setCredentials] = useState<Credentials | null>(null);

	useEffect(() => {
		retrieveCredentials();
	}, []);

	async function retrieveCredentials() {
		const token = AuthService.getToken();
		if (token) {
			const myCredentials = await vaultSDK.getCredentials(token);
			setCredentials(myCredentials);
		} else {
		}
	}

	async function renameCredential(id: string, name: string) {
		const token = AuthService.getToken();
		if (token) {
			console.log("rename begin!");
			await vaultSDK.renameCredential(token, id, name);
			await retrieveCredentials();
			console.log("rename completed!");
		}
	}

	return (
		<Grid container spacing={2} direction="column">
			<Grid item xs container direction="row" spacing={1}>
				<Grid
					item
					xs={12}
					md={6}
					sx={{
						display: "flex",
						justifyContent: { md: "flex-start", xs: "center" },
					}}
				>
					<Stack spacing={2} direction="row" alignItems={"center"}>
						<Stack direction="row" spacing={1}>
							<Typography variant="h2" color="secondary">
								My Credentials
							</Typography>
							<HtmlTooltip
								title={
									<Stack>
										<Typography variant="body2">
											Credentials are associated with your
											devices and/or browsers. You can add
											new credentials or recovery options
											for your Account.
										</Typography>
										<Link variant="body2" color="inherit">
											Learn more about Credentials.
										</Link>
									</Stack>
								}
								arrow
							>
								<InfoOutlined color="secondary"></InfoOutlined>
							</HtmlTooltip>
						</Stack>
						<Button
							onClick={() => navigate("/add_credential")}
							color="primary"
							variant="contained"
							sx={{
								display: { xs: "inherit", md: "none" },
							}}
						>
							<Add />
						</Button>
					</Stack>
				</Grid>
				<Grid
					item
					xs={12}
					md={6}
					sx={{
						justifyContent: "flex-end",
						display: { xs: "none", md: "flex" },
					}}
				>
					<Button
						variant="contained"
						onClick={() => navigate("/add_credential")}
					>
						+ Add New Credential
					</Button>
				</Grid>
				<Grid
					item
					xs={12}
					md={12}
					sx={{
						display: "flex",
						justifyContent: { md: "flex-start", xs: "center" },
						// maxWidth: "400px",
					}}
				>
					<Typography variant="body1">
						Credentials are a combination of browsers and devices
						used to give you access to your account.
					</Typography>
				</Grid>
			</Grid>
			<Grid item xs container direction="row" spacing={1}>
				{credentials?.credentials?.map((credential) => (
					<Grid item xs={12} md={6} key={credential.id}>
						<CredentialCards
							credential={credential}
							rename={renameCredential}
						></CredentialCards>
					</Grid>
				))}
			</Grid>
		</Grid>
	);
};
