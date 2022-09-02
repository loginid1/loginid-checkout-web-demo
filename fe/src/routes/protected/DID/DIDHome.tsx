import { Add, ContentCopy } from "@mui/icons-material";
import {
	Grid,
	Stack,
	Typography,
	Button,
	TableContainer,
	Table,
	TableHead,
	Paper,
	TableCell,
	TableRow,
	TableBody,
	IconButton,
} from "@mui/material";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DappPartnerList from "../../../components/DappPartnerList";
import { VaultBase } from "../../../components/VaultBase";
import ParseUtil from "../../../lib/util/parse";
import vaultSDK from "../../../lib/VaultSDK";
import {
	EnableAccount,
	EnableAccountList,
} from "../../../lib/VaultSDK/vault/algo";
import { Profile } from "../../../lib/VaultSDK/vault/user";
import { AuthService } from "../../../services/auth";

export default function DIDHome(){
	const navigate = useNavigate();


	useEffect(() => {
	}, []);


	return (
		<VaultBase focus={3}>

			<Paper
				elevation={0}
				sx={{
					p: { md: 4, xs: 2 },
					mb: 2,
					display: "flex",
					justifyContent: "center",
				}}
			>
				<Grid container spacing={{ md: 4, xs: 2 }} direction="column">
					<Typography
						variant="h2"
						color="secondary"
						align="left"
						sx={{
							pt: { md: 4, xs: 2 },
							pl: { md: 4, xs: 2 },
						}}
					>
						Decentralize Identities
					</Typography>
					<Typography
						variant="subtitle1"
						align="left"
						sx={{
							pt: { md: 4, xs: 2 },
							pl: { md: 4, xs: 2 },
						}}
					>
						Comming Soon ...
					</Typography>
          
				</Grid>
			</Paper>
		</VaultBase>
	);
};

