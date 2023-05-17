import {
	alpha,
	Box,
	Button,
	Card,
	CardActions,
	CardContent,
	Dialog,
	Stack,
	TextField,
	Typography,
} from "@mui/material";
import React, { useState } from "react";
import ParseUtil from "../lib/util/parse";
import { Credential } from "../lib/VaultSDK/vault/user";

interface CredentialCard {
	credential: Credential;
	rename?: (id: string, name: string) => Promise<void>;
}

export const CredentialCards: React.FC<CredentialCard> = ({
	credential,
	rename,
}) => {
	const [openRename, setOpenRename] = useState(false);
	const [newName, setNewName] = useState("");
	const credIAT = ParseUtil.parseDateTime(credential.iat);

	const handleClickRenameCredential = () => {
		setOpenRename(true);
	};

	const handleCancelRename = () => {
		setNewName("");
		setOpenRename(false);
	};

	const handleSubmitRename = async () => {
		if (rename) {
			await rename(credential.id, newName);
		} else {
			console.error("rename not available");
		}
		setOpenRename(false);
	};

	return (
		<Card
			variant="outlined"
			sx={{
				width: "100%",
				backgroundColor: alpha("#F2F2F2", 0.2),
			}}
			elevation={0}
		>
				<CardContent>
					<Typography
						noWrap
						variant="h3"
            component="div"
					>
						{credential.name}
					</Typography>
					<Typography noWrap variant="caption" component="div">
						Added {credIAT}
					</Typography>
				</CardContent>
				{rename && (
					<CardActions>
						<Button
							variant="text"
							onClick={handleClickRenameCredential}
							size="small"
							fullWidth={false}
						>
							Rename
						</Button>
					</CardActions>
				)}
				<Dialog
					open={openRename}
					sx={{
						display: "flex",
						justifyContent: "center",
					}}
					onClose={handleCancelRename}
				>
					<Stack
						spacing={2}
						sx={{
							alignItems: "center",
							p: 6,
							width: "400px",
						}}
					>
						<Typography variant="h2" color="secondary">
							Rename Credential
						</Typography>
						<Typography variant="body1"></Typography>
						<TextField
							fullWidth
							onChange={(e) => setNewName(e.target.value)}
							label="new credential name"
							focused
						></TextField>
						<Stack spacing={2} direction="row">
							<Button onClick={handleCancelRename}>Cancel</Button>
							<Button
								variant="contained"
								color="primary"
								onClick={handleSubmitRename}
							>
								Submit
							</Button>
						</Stack>
					</Stack>
				</Dialog>
		</Card>
	);
};
