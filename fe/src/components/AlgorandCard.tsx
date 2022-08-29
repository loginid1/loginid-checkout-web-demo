import {
	Alert,
	alpha,
	Avatar,
	Box,
	Button,
	Card,
	CardActions,
	CardContent,
	CardHeader,
	Chip,
	Dialog,
	Divider,
	Grid,
	IconButton,
	Menu,
	MenuItem,
	Paper,
	Stack,
	SvgIcon,
	Tab,
	Tabs,
	TextField,
	Typography,
} from "@mui/material";
import TabPanel from "@mui/lab/TabPanel";
import React, { useState } from "react";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { Recovery } from "../lib/VaultSDK/vault/user";
import { LoginID } from "../theme/theme";
import {
	ArrowDropDown,
	ContentCopy,
	ExpandMore,
	NavigateNextTwoTone,
} from "@mui/icons-material";
import { ReactComponent as SendWyreLogo} from "../assets/partners/sendwyre_logo_icon.svg";
import { Account } from "../lib/VaultSDK/vault/algo";
import ParseUtil from "../lib/util/parse";
import { useNavigate } from "react-router-dom";
import { red } from "@mui/material/colors";
import { DisplayShortTransaction, DisplayTransactionTab } from "./TransactionSummary";
import { AlgoIcon } from "../icons/Common";
import { TabContext } from "@mui/lab";
import { DisplayAssets, DisplayShortAsset } from "./AssetSummary";
import styles from "../styles/common.module.css";
import { DisplayDapps } from "./DappSummary";
import wyreSDK from "../lib/VaultSDK/sendwyre";

interface AlgorandAccountCard {
	account: Account;
	rename: (id: string, alias: string) => Promise<void>;
	refresh?: () => void;
}

const cutoff = (s: string) => {
	return s.substring(0, 10) + "...";
};

export const AlgorandCard: React.FC<AlgorandAccountCard> = ({
	account,
	rename,
	refresh
}) => {
	const navigate = useNavigate();
	const [openRename, setOpenRename] = useState(false);
	const [newAlias, setNewAlias] = useState("");
	const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

	const accountIAT = ParseUtil.parseDate(account.iat);
	const cutAddress = ParseUtil.displayLongAddress(account.address);
	const copyAddress = () => {
		navigator.clipboard.writeText(account.address);
	};
	const open = Boolean(anchorEl);

	const [tabValue, setTabValue] = React.useState<string>("asa");

	const handleChange = (event: any, newValue: string) => {
		setTabValue(newValue);
	};

	const handleClickRenameAccount = () => {
		setOpenRename(true);
	};

	const handleCancelRename = () => {
		setNewAlias("");
		setOpenRename(false);
	};

	const handleSubmitRename = async () => {
		await rename(account.id, newAlias);
		setOpenRename(false);
	};

	function handlePurchaseAlgo() {
		wyreSDK.orderCall(account.address);
	}

	function handleClickTransaction(address: string) {
		navigate("/algorand_transactions?address=" + address);
	}

	function handleClickRekey(address: string) {
		navigate("/rekey_algorand/" + address);
	}

	function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
		setAnchorEl(event.currentTarget);
	}

	function handleClose() {
		setAnchorEl(null);
	}

	return (
		<Box>
			<Card
				variant="outlined"
				sx={{ width: "100%", backgroundColor: alpha("#F2F2F2", 0.2) }}
				elevation={0}
			>
				<CardHeader
					avatar={<AlgoIcon color="primary" />}
					action={
						<>
							<IconButton
								aria-label="settings"
								aria-controls={open ? "basic-menu" : undefined}
								aria-haspopup="true"
								aria-expanded={open ? "true" : undefined}
								onClick={handleClick}
							>
								<MoreVertIcon />
							</IconButton>
							<Menu
								id="basic-menu"
								anchorEl={anchorEl}
								open={open}
								onClose={handleClose}
							>
								<MenuItem
									onClick={handleClickRenameAccount}
									color="primary"
								>
									Change Alias
								</MenuItem>
								<MenuItem
									onClick={() =>
										handleClickRekey(account.address)
									}
									color="primary"
								>
									Rekey
								</MenuItem>
							</Menu>
						</>
					}
					title={account.alias}
					subheader={"Added " + accountIAT}
				></CardHeader>

				<CardContent
					sx={{
						display: "flex",
						flexDirection: "column",
						justifyContent: "center",
					}}
				>
					{/* <Alert severity="error">This is an error alert — check it out!</Alert> */}
					<Grid container>
						<Grid item xs={12} md={6}>
							<Typography
								variant="body1"
								align="left"
								fontSize="12px"
							>
								Address:{" "}
								<Chip
									sx={{ backgroundColor: "#E2F2FF" }}
									size="small"
									label={cutAddress}
								/>
								<IconButton size="small" onClick={copyAddress}>
									<ContentCopy />
								</IconButton>
							</Typography>
							{account.recovery_address && (
								<Typography
									variant="body1"
									align="left"
									fontSize="12px"
								>
									Recovery option:{" "}
									<Chip
										sx={{ backgroundColor: "#E2F2FF" }}
										size="small"
										label={cutoff(account.recovery_address)}
									/>
								</Typography>
							)}
							<Typography
								variant="body1"
								align="left"
								fontSize="12px"
							>
								Credentials:{" "}
								{account.credentials_name.map((name) => (
									<Chip
										sx={{ backgroundColor: "#E2F2FF" }}
										size="small"
										label={name}
									/>
								))}
							</Typography>
							{account.balance && (
								<>
									<Typography
										noWrap
										variant="body1"
										align="left"
										fontSize="12px"
									>
										ASA:{" "}
										<Chip
											sx={{ backgroundColor: "#E2F2FF" }}
											size="small"
											label={
												account.balance?.asa_count +
												" items"
											}
										/>
									</Typography>
									<Typography
										noWrap
										variant="body1"
										align="left"
										fontSize="12px"
									>
										Balance:{" "}
										<Chip
											sx={{ backgroundColor: "#E2F2FF" }}
											size="small"
											label={
												account.balance?.amount +
												" mAlgo"
											}
										/>
									</Typography>
									<Typography
										variant="body1"
										align="left"
										fontSize="12px"
									>
										Status:{" "}
										<Chip
											sx={{ backgroundColor: "#E2F2FF" }}
											size="small"
											label={account.balance?.status}
										/>
									</Typography>
								</>
							)}
						</Grid>
						<Grid container item xs={12} md={6} sx={{mt:1,mb:1}}>
							<Button variant="outlined" startIcon={<SendWyreIcon />} onClick={handlePurchaseAlgo} fullWidth>Buy ALGO via SendWyre</Button>
							<Typography variant="caption"   >
								Purchase ALGO using your credit/debit card. 
							</Typography>
						</Grid>
					</Grid>
					<TabContext value={tabValue}>
					<Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
						<Tabs
							value={tabValue}
							onChange={handleChange}
							textColor="secondary"
							indicatorColor="secondary"
							aria-label="secondary tabs example"
						>
							<Tab value="asa" label="Assets" />
							<Tab value="tx" label="Transactions" />
							<Tab value="dapps" label="Dapps" />
						</Tabs>
						</Box>
						<TabPanel value="asa">
							{DisplayAssets(account.assets, account.address, refresh)}
						</TabPanel>
						<TabPanel value="tx">
							{account.transactions &&
							DisplayTransactionTab(account.transactions,account.address)
										}

							{account.transactions && (
								<Button
									sx={{ m: 1 }}
									size="small"
									fullWidth
									onClick={() =>
										handleClickTransaction(account.address)
									}
								>
									Transactions ...
								</Button>
							)}
						</TabPanel>
						<TabPanel value="dapps">
							{DisplayDapps(account.dapps)}
						</TabPanel>
					</TabContext>
				</CardContent>
			</Card>

			<Dialog
				open={openRename}
				maxWidth="xs"
				fullWidth
				onClose={handleCancelRename}
			>
				<Stack
					spacing={2}
					sx={{
						display: 'flex',
						m: 2,
					}}
					alignItems="center"
				>
					<Typography variant="h2" color="secondary">
						Change Alias
					</Typography>
					<Typography variant="body1"></Typography>
					<TextField
						fullWidth
						onChange={(e) => setNewAlias(e.target.value)}
						label="new alias"
						focused
					></TextField>
					<Stack spacing={2} direction="row" >
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
		</Box>
	);
};

function SendWyreIcon(props: any) {
	return <SvgIcon {...props} component={SendWyreLogo} inheritViewBox></SvgIcon>;
}