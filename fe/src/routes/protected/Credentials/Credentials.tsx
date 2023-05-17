import { Paper, Typography } from "@mui/material";
import React, { useEffect, useState } from "react";
import { DisplayConsents } from "../../../components/AppConsentList";
import { CredentialsManage } from "../../../components/CredentialsManage";
import { RecoveryManage } from "../../../components/RecoveryManage";
import { VaultBase } from "../../../components/VaultBase";
import vaultSDK from "../../../lib/VaultSDK";
import { Consent } from "../../../lib/VaultSDK/vault/user";
import { AuthService } from "../../../services/auth";

const Credentials: React.FC = () => {
	const [errorMessage, setErrorMessage] = useState("");

	const [consents, setConsents] = useState<Consent[]>([]);

	useEffect(() => {
		const fetchData = async () => {
			const token = AuthService.getToken();
			if (token) {
				const result = await vaultSDK.getConsentList(token);
				console.log(result);
				setConsents(result.consents);
			}
		};

		fetchData();
	}, []);
	return (
		<VaultBase focus={"passkeys"}>
			<Paper
				elevation={0}
				sx={{
					p: { md: 4, xs: 2 },
					display: "flex",
					flexDirection: "column",
				}}
			>
				<CredentialsManage />
			</Paper>

			<Paper
				elevation={0}
				sx={{
					p: { md: 4, xs: 2 },
					display: "flex",
					flexDirection: "column",
				}}
			>
				<Typography variant="h2" color="secondary" align="left">
					Consent History
				</Typography>
				{DisplayConsents(consents)}
			</Paper>
		</VaultBase>
	);
};

export default Credentials;
