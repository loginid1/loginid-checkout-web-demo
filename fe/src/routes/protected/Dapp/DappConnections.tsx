import { Add, ContentCopy, InfoOutlined } from "@mui/icons-material";
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
	Link,
} from "@mui/material";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DappPartnerList from "../../../components/DappPartnerList";
import { HtmlTooltip } from "../../../components/HtmlTooltip";
import { VaultBase } from "../../../components/VaultBase";
import ParseUtil from "../../../lib/util/parse";
import vaultSDK from "../../../lib/VaultSDK";
import {
	EnableAccount,
	EnableAccountList,
} from "../../../lib/VaultSDK/vault/algo";
import { Profile } from "../../../lib/VaultSDK/vault/user";
import { AuthService } from "../../../services/auth";

const DappConnections: React.FC = () => {
	const navigate = useNavigate();

	const [accountList, setAccountList] = useState<EnableAccountList | null>(
		null
	);

	useEffect(() => {
		getEnableAccountList();
	}, []);

	async function getEnableAccountList() {
		const token = AuthService.getToken();
		if (token) {
			const accountList = await vaultSDK.getEnableAccountList(token);
			console.log(accountList);
			setAccountList(accountList);
		} else {
		}
	}

	async function revokeEnableAccount(account: EnableAccount) {
		const token = AuthService.getToken();
		if (token) {
			await vaultSDK.revokeEnableAccount(token, account.id);
		} else {
		}
	}

	const copyAddress = (account: EnableAccount) => {
		navigator.clipboard.writeText(account.wallet_address);
	};
	return (
		<VaultBase focus={2}>
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
					<Stack
						direction="row"
						spacing={1}
						sx={{
							pt: { md: 4, xs: 2 },
							pl: { md: 4, xs: 2 },
						}}
					>
						<Typography variant="h2" color="secondary">
							Dapp Connections
						</Typography>
						<HtmlTooltip
							title={
								<Stack>
									<Typography variant="body2">
										DApps are short for decentralized
										applications that are built on a
										blockchain.
									</Typography>
									<Link variant="body2" color="inherit">
										Learn more about DApps.
									</Link>
								</Stack>
							}
							arrow
						>
							<InfoOutlined color="secondary"></InfoOutlined>
						</HtmlTooltip>
					</Stack>
					<TableContainer
						sx={{
							pl: { md: 4, xs: 2 },
						}}
					>
						<Table>
							<TableHead>
								<TableRow>
									<TableCell>Revoke Connection</TableCell>
									<TableCell align="right">
										Wallet Address
									</TableCell>
									<TableCell align="right">Added</TableCell>
									<TableCell align="right">
										Dapp Origin
									</TableCell>
									<TableCell align="right">Network</TableCell>
								</TableRow>
							</TableHead>
							<TableBody>
								{accountList?.accounts?.map((account) => (
									<TableRow key={account.id}>
										<TableCell component="th" scope="row">
											<Button
												variant="outlined"
												color="error"
												onClick={() =>
													revokeEnableAccount(account)
												}
											>
												Revoke
											</Button>
										</TableCell>
										<TableCell align="right">
											<IconButton
												size="small"
												onClick={() =>
													copyAddress(account)
												}
											>
												<ContentCopy />
											</IconButton>
											{ParseUtil.displayLongAddress(
												account.wallet_address
											)}
										</TableCell>
										<TableCell align="right">
											{ParseUtil.parseDateTime(
												account.iat
											)}
										</TableCell>
										<TableCell align="right">
											<Typography noWrap>
												{account.dapp_origin}
											</Typography>
										</TableCell>
										<TableCell align="right">
											{ParseUtil.removeNetworkPrefix(
												account.network
											)}
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</TableContainer>
				</Grid>
			</Paper>

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
						Feature Partners
					</Typography>

					<DappPartnerList></DappPartnerList>
				</Grid>
			</Paper>
		</VaultBase>
	);
};

export default DappConnections;
