import { Add, Delete, MoreVert, Edit, Computer, Web } from "@mui/icons-material";
import {
	Button,
	Grid,
	Menu,
	Stack,
	Typography,
	CircularProgress,
	Card,
	IconButton,
	MenuItem,
	ListItemIcon,
	ListItemText,
	CardHeader,
	Chip,
	Tooltip,
	Dialog,
	TextField,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import vaultSDK from "../../../lib/VaultSDK";
import { Credentials, Credential } from "../../../lib/VaultSDK/vault/user";
import { AuthService } from "../../../services/auth";
import { VaultBase } from "../../../components/VaultBase";
import Moment from "moment";
// import { CredentialCards } from "./CredentialCard";
// import { HtmlTooltip } from "./HtmlTooltip";

const PasskeyMenu = (props: {id: string; name: string; refreshCredentials: () => Promise<void>}) => {
	const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
	const [rename, setRename] = useState(false);
	const [passkeyName, setPasskeyName] = useState(props.name);
	const open = Boolean(anchorEl);

	const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
		setAnchorEl(event.currentTarget);
	};
	const handleClose = () => {
		setAnchorEl(null);
	};
	const handleCancelRename = () => {
		setRename(false);
		setPasskeyName(props.name);
	};
	const handleSubmitRename = async () => {
		const token = AuthService.getToken();
		if (token) {
			await vaultSDK.renameCredential(token, props.id, passkeyName);
			await props.refreshCredentials();
			setRename(false);
		}
	};

	return (
		<>
			<IconButton
				id={`pass-settings-${props.id}`}
				aria-controls={open ? `pass-menu-${props.id}` : undefined}
				aria-haspopup="true"
				aria-expanded={open ? 'true' : undefined}
				onClick={handleClick}
				aria-label="settings">
				<MoreVert />
			</IconButton>
			<Menu
				id={`pass-menu-${props.id}`}
				anchorEl={anchorEl}
				open={open}
				onClose={handleClose}
				MenuListProps={{
					'aria-labelledby': `pass-settings-${props.id}`
				}}
				anchorOrigin={{
					vertical: 'bottom',
					horizontal: 'right',
				}}
				transformOrigin={{
					vertical: 'top',
					horizontal: 'right',
				}}
			>
				<MenuItem onClick={() => { setRename(true); setAnchorEl(null);}}>
					<ListItemIcon>
						<Edit fontSize="small" />
					</ListItemIcon>
					<ListItemText>Rename</ListItemText>
				</MenuItem>
				{/* <MenuItem onClick={handleDelete} sx={{color: "#DD0031"}}>
					<ListItemIcon>
						<Delete fontSize="small" sx={{color: "#DD0031"}}/>
					</ListItemIcon>
					<ListItemText>Delete</ListItemText>
				</MenuItem> */}
			</Menu>
			<Dialog
				open={rename}
				onClose={handleCancelRename}
				sx={{
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
					<Typography variant="h2" color="secondary">
						Rename Credential
					</Typography>
					<TextField
						fullWidth
						onChange={(e) => setPasskeyName(e.target.value)}
						value={passkeyName}
						label="Passkey Name"
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
		</>
	)
}

const Passkeys = () => {
	const navigate = useNavigate();

	const [credentials, setCredentials] = useState<Credential[] | null>(null);

	useEffect(() => {
		retrieveCredentials();
	}, []);

	async function retrieveCredentials() {
		const token = AuthService.getToken();
		if (token) {
			const myCredentials = await vaultSDK.getCredentials(token);
			if(myCredentials != null) {
				setCredentials(myCredentials.credentials);
			}
		} else {
		}
	}

	return (
		<VaultBase focus={"passkeys"}>
			<Stack 
				direction="row" 
				justifyContent="space-between"
				sx={{
					padding: { md: 4, xs: 2 },
				}}
			>
				<Typography
					variant="h2"
					color="secondary"
					align="left"
				>
					Passkeys
				</Typography>
				{
					(credentials !== null  && credentials.length !== 0) &&
					<Button variant="text" onClick={() => {navigate('/passkeys/new')}}>
						<Add/>
						Add a new passkey
					</Button>
				}
			</Stack>
			{ 
					credentials === null || credentials.length === 0 ? 
					(
						<>
							<Typography align="center" fontSize={24} fontWeight="bold" color="rgba(0,0,0,0.5)" sx={{pb: 5, pt: 10}}>
								You don't have any passkey yet! 
							</Typography>
						</>
					) : (
						<>
							<Grid container direction="row" >
								{ credentials.map(credential => (
									<Grid item padding={2} xl={4} lg={4} md={6} xs={12}>
										<Card sx={{ display:"flex", flexWrap:"wrap", flexDirection:"column", justifyContent:"space-between" }}>
											<CardHeader
												action={
													<PasskeyMenu id={credential.id} name={credential.name} refreshCredentials={retrieveCredentials}/>
												}
												title={
													<Typography align="left" fontSize={20} lineHeight={1.5}>
														{credential.name}
													</Typography>
												}
												subheader={ 
													<>
														<Typography align="left" fontSize={14} color="rgba(0,0,0,0.5)">
															Added {Moment(credential.iat).format("DD/MM/YYYY hh:mm A")}
														</Typography>
														{
															credential.user_agent &&
															<Stack direction="row" mt={2} >
																<Tooltip title="Operating System" arrow>
																	<Chip sx={{marginRight: 1}} size="small" icon={<Computer />} label={credential.user_agent?.operating_system} />
																</Tooltip>
																<Tooltip title="Browser" arrow>
																	<Chip sx={{marginRight: 1}} size="small" icon={<Web />} label={credential.user_agent?.browser} />
																</Tooltip>
															</Stack>
														}
													</>
												}
											/>
										</Card>
									</Grid>
								))}
							</Grid>
						</>
					)
			}
		</VaultBase>
	);
};

export default Passkeys;
