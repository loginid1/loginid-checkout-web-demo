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
	IconButton,
	Menu,
	MenuItem,
	Stack,
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
import { Account } from "../lib/VaultSDK/vault/algo";
import ParseUtil from "../lib/util/parse";
import { useNavigate } from "react-router-dom";
import { red } from "@mui/material/colors";
import { DisplayShortTransaction } from "./TransactionSummary";
import { AlgoIcon } from "../icons/Common";
import { TabContext } from "@mui/lab";
import { DisplayAssets, DisplayShortAsset } from "./AssetSummary";
import styles from "../styles/common.module.css";
import { DisplayDapps } from "./DappSummary";

interface AlgorandAccountCard {
	account: Account;
	rename: (id: string, alias: string) => Promise<void>;
}

const cutoff = (s: string) => {
	return s.substring(0, 10) + "...";
};

export const AlgorandCard: React.FC<AlgorandAccountCard> = ({
	account,
	rename,
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

					<Typography variant="body1" align="left" fontSize="12px">
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
					<Typography variant="body1" align="left" fontSize="12px">
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
										account.balance?.asa_count + " items"
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
									label={account.balance?.amount + " mAlgo"}
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
					<TabContext value={tabValue}>
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
						<TabPanel value="asa">
							{DisplayAssets(account.assets, account.address)}
						</TabPanel>
						<TabPanel value="tx">
							{account.transactions &&
								account.transactions.map((transaction) => (
									<>
										{DisplayShortTransaction(
											transaction,
											account.address
										)}
									</>
								))}

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
						Change Alias
					</Typography>
					<Typography variant="body1"></Typography>
					<TextField
						fullWidth
						onChange={(e) => setNewAlias(e.target.value)}
						label="new alias"
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
		</Box>
	);
};
