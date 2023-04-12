import {
	Box,
	Button,
	CssBaseline,
	Grid,
	Link,
	Paper,
	Stack,
	ThemeProvider,
	Tooltip,
	Typography,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Profile } from "../../../lib/VaultSDK/vault/user";
import { AuthService } from "../../../services/auth";
import { LoginID } from "../../../theme/theme";
import { Menu } from "../../../components/Menu";
import VaultAppBar from "../../../components/VaultAppbar";
import { CredentialsManage } from "../../../components/CredentialsManage";
import { RecoveryManage } from "../../../components/RecoveryManage";
import vaultSDK from "../../../lib/VaultSDK";
import { Add, ArrowBack, InfoOutlined } from "@mui/icons-material";
import { AccountList } from "../../../lib/VaultSDK/vault/algo";
import { AlgorandCard } from "../../../components/AlgorandCard";
import { VaultBase } from "../../../components/VaultBase";
import { HtmlTooltip } from "../../../components/HtmlTooltip";
import { GetStartedDialog } from "../../../components/dialogs/GetStartedDialog";

const AlgorandAccounts: React.FC = () => {
	const navigate = useNavigate();
  	const location = useLocation();

	const [searchParams, setSearchParams] = useSearchParams();
	const [profile, setProfile] = useState<Profile | null>(null);
	const [accountList, setAccountList] = useState<AccountList | null>(null);
	const [username, setUsername] = useState(AuthService.getUsername());

	const [errorMessage, setErrorMessage] = useState("");

	const [started, setStarted] = useState(false);
	const [newAddress, setNewAddress] = useState("");

	useEffect(() => {
  		const address = location.state as string;
		//const address = searchParams.get("address");
		if (address != null ) {
			console.log("open first");
			setStarted(true);
			setNewAddress(address);

		}
		getAccountList();
	}, []);

	async function getAccountList() {
		const token = AuthService.getToken();
		if (token) {
			const accountList = await vaultSDK.getAccountList(token, true);
			setAccountList(accountList);
		} else {
		}
	}

	async function renameAccount(id: string, alias: string) {
		const token = AuthService.getToken();
		if (token) {
			await vaultSDK.renameAccount(token, id, alias);
			await getAccountList();
		} else {
		}
	}

	return (
		<VaultBase focus={"algo_accounts"}>
			<Paper
				elevation={0}
				sx={{
					p: { md: 4, xs: 2 },
					display: "flex",
					flexDirection: "column",
				}}
			>
				<GetStartedDialog open={started} address={newAddress} handleClose={function (): void {
					setStarted(false);
				} }/>
				<Grid container spacing={{ md: 4, xs: 2 }} direction="column">
					<Grid item xs container direction="row" spacing={2}>
						<Grid
							item
							xs={12}
							md={12}
							sx={{
								display: "flex",
								justifyContent: {
									md: "flex-start",
									xs: "center",
								},
							}}
						>
							<Stack
								spacing={2}
								direction="row"
								alignItems={"center"}
							>
								<Stack direction="row" spacing={1}>
									<Typography variant="h2" color="secondary">
										Algorand Accounts
									</Typography>
									<HtmlTooltip
										title={
											<Stack>
												<Typography variant="body2">
													Your Algorand account is a
													blockchain account which is
													used to interact with
													Algorand Dapps.
												</Typography>
												<Link
													variant="body2"
													color="inherit"
												>
													Learn more about your
													Algorand account
												</Link>
											</Stack>
										}
										arrow
									>
										<InfoOutlined color="secondary"></InfoOutlined>
									</HtmlTooltip>
								</Stack>
								<Button
									onClick={() =>
										navigate("/add_algorand_account")
									}
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
						{/* 
						<Grid
							item
							xs={12}
							md={6}
							sx={{
								display: { xs: "none", md: "flex" },
								justifyContent: "flex-end",
							}}
						>
							<Button
								variant="contained"
								onClick={() =>
									navigate("/add_algorand_account")
								}
							>
								+ Create Algorand Account
							</Button>
						</Grid>
						*/}
						<Grid
							item
							xs={12}
							md={12}
							sx={{
								display: "flex",
								justifyContent: {
									md: "flex-start",
									xs: "center",
								},
								maxWidth: "400px",
							}}
						>
							{accountList?.accounts?.length ? (
								<Typography variant="body1">
									Your Algorand account(s) are below.
								</Typography>
							) : (
								<Typography variant="body1">
									To setup FIDO authentication for Algorand
									based DApps, start by creating your account.
								</Typography>
							)}
						</Grid>
					</Grid>

					<Grid item xs container direction="column" spacing={2}>
						{accountList?.accounts?.map((account) => (
								<Grid item key={account.address}>
									<AlgorandCard
										account={account}
										rename={renameAccount}
										refresh={getAccountList}
									></AlgorandCard>
								</Grid>

						))}
					</Grid>
				</Grid>
			</Paper>
		</VaultBase>
	);
};

export default AlgorandAccounts;
