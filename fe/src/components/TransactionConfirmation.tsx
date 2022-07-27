import { Grid, Typography, Divider } from "@mui/material";
import { AlgoIcon } from "../icons/Common";
import ParseUtil from "../lib/util/parse";
import { PaymentTransaction, AssetOptin, AssetTransfer, AppOptin, AppCall, BaseTransaction } from "../lib/VaultSDK/vault/algo";

function DisplayPayment(txn: PaymentTransaction) {
	return (
		<Grid container spacing={1}>
			<Grid item xs={12}>
				<Typography variant="h6">Transaction Details</Typography>
			</Grid>
			<Grid item xs={12}>
				<Typography variant="subtitle2">{txn.iat}</Typography>
			</Grid>
			<Grid item xs={12}>
				<Divider variant="fullWidth" />
			</Grid>
			<Grid item xs={6} sx={{ "text-align": "left" }}>
				<Typography variant="subtitle1">Transfer:</Typography>
			</Grid>
			<Grid item xs={6} sx={{ "text-align": "left" }}>
				<Typography variant="body1">ALGO </Typography>
			</Grid>
			<Grid item xs={6} sx={{ "text-align": "left" }}>
				<Typography variant="subtitle1">Amount:</Typography>
			</Grid>
			<Grid item xs={6} sx={{ "text-align": "left" }}>
				<Typography variant="body1">
					{ParseUtil.convertAlgo(txn.amount)} <AlgoIcon color="primary" sx={{fontSize: 14}}/>
				</Typography>
			</Grid>
			<Grid item xs={6} sx={{ "text-align": "left" }}>
				<Typography variant="subtitle1">From:</Typography>
			</Grid>
			<Grid item xs={6} sx={{ "text-align": "left" }}>
				<Typography variant="body1">
					{ParseUtil.displayAddress(txn.base.from)}
				</Typography>
			</Grid>
			<Grid item xs={6} sx={{ "text-align": "left" }}>
				<Typography variant="subtitle1">To:</Typography>
			</Grid>
			<Grid item xs={6} sx={{ "text-align": "left" }}>
				<Typography variant="body1">
					{ParseUtil.displayAddress(txn.to)}
				</Typography>
			</Grid>
			<Grid item xs={6} sx={{ "text-align": "left" }}>
				<Typography variant="subtitle1">Fee:</Typography>
			</Grid>
			<Grid item xs={6} sx={{ "text-align": "left" }}>
				<Typography variant="body1">
					{ParseUtil.convertAlgo(txn.base.fee)} <AlgoIcon color="primary" sx={{fontSize: 14}}/>
				</Typography>
			</Grid>

			<Grid item xs={6} sx={{ "text-align": "left" }}>
				<Typography variant="subtitle1">Note:</Typography>
			</Grid>
			<Grid item xs={6} sx={{ "text-align": "left" }}>
				<Typography variant="body1">{txn.base.note}</Typography>
			</Grid>
		</Grid>
	);
}

function DisplayAssetOptin(txn: AssetOptin) {
	return (
		<Grid container spacing={1}>
			<Grid item xs={12}>
				<Typography variant="h6">Transaction Details</Typography>
			</Grid>
			<Grid item xs={12}>
				<Typography variant="subtitle2">{txn.iat}</Typography>
			</Grid>
			<Grid item xs={12}>
				<Divider variant="fullWidth" />
			</Grid>
			<Grid item xs={6} sx={{ "text-align": "left" }}>
				<Typography variant="subtitle1">ASA Opt-In:</Typography>
			</Grid>
			<Grid item xs={6} sx={{ "text-align": "left" }}>
				<Typography variant="body1">ID#{txn.assetid}</Typography>
			</Grid>
			<Grid item xs={6} sx={{ "text-align": "left" }}>
				<Typography variant="subtitle1">From:</Typography>
			</Grid>
			<Grid item xs={6} sx={{ "text-align": "left" }}>
				<Typography variant="body1">
					{ParseUtil.displayAddress(txn.base.from)}
				</Typography>
			</Grid>
			<Grid item xs={6} sx={{ "text-align": "left" }}>
				<Typography variant="subtitle1">Fee:</Typography>
			</Grid>
			<Grid item xs={6} sx={{ "text-align": "left" }}>
				<Typography variant="body1">
					{ParseUtil.convertAlgo(txn.base.fee)} <AlgoIcon color="primary" sx={{fontSize: 14}}/>
				</Typography>
			</Grid>

			<Grid item xs={6} sx={{ "text-align": "left" }}>
				<Typography variant="subtitle1">Note:</Typography>
			</Grid>
			<Grid item xs={6} sx={{ "text-align": "left" }}>
				<Typography variant="body1">{txn.base.note}</Typography>
			</Grid>
		</Grid>
	);
}

function DisplayAssetTransfer(txn: AssetTransfer) {
	return (
		<Grid container spacing={1}>
			<Grid item xs={12}>
				<Typography variant="h6">Transaction Details</Typography>
			</Grid>
			<Grid item xs={12}>
				<Typography variant="subtitle2">{txn.iat}</Typography>
			</Grid>
			<Grid item xs={12}>
				<Divider variant="fullWidth" />
			</Grid>
			<Grid item xs={6} sx={{ "text-align": "left" }}>
				<Typography variant="subtitle1">ASA Transfer:</Typography>
			</Grid>
			<Grid item xs={6} sx={{ "text-align": "left" }}>
				<Typography variant="body1">ID#{txn.assetid}</Typography>
			</Grid>
			<Grid item xs={6} sx={{ "text-align": "left" }}>
				<Typography variant="subtitle1">Amount:</Typography>
			</Grid>
			<Grid item xs={6} sx={{ "text-align": "left" }}>
				<Typography variant="body1">
					{txn.amount}
				</Typography>
			</Grid>
			<Grid item xs={6} sx={{ "text-align": "left" }}>
				<Typography variant="subtitle1">From:</Typography>
			</Grid>
			<Grid item xs={6} sx={{ "text-align": "left" }}>
				<Typography variant="body1">
					{ParseUtil.displayAddress(txn.base.from)}
				</Typography>
			</Grid>
			<Grid item xs={6} sx={{ "text-align": "left" }}>
				<Typography variant="subtitle1">To:</Typography>
			</Grid>
			<Grid item xs={6} sx={{ "text-align": "left" }}>
				<Typography variant="body1">
					{ParseUtil.displayAddress(txn.to)}
				</Typography>
			</Grid>
			<Grid item xs={6} sx={{ "text-align": "left" }}>
				<Typography variant="subtitle1">Fee:</Typography>
			</Grid>
			<Grid item xs={6} sx={{ "text-align": "left" }}>
				<Typography variant="body1">
					{ParseUtil.convertAlgo(txn.base.fee)} <AlgoIcon color="primary" sx={{fontSize: 14}}/>
				</Typography>
			</Grid>

			<Grid item xs={6} sx={{ "text-align": "left" }}>
				<Typography variant="subtitle1">Note:</Typography>
			</Grid>
			<Grid item xs={6} sx={{ "text-align": "left" }}>
				<Typography variant="body1">{txn.base.note}</Typography>
			</Grid>
		</Grid>
	);
}

function DisplayAppOptin(txn: AppOptin) {
	return (
		<Grid container spacing={1}>
			<Grid item xs={12}>
				<Typography variant="h6">Transaction Details</Typography>
			</Grid>
			<Grid item xs={12}>
				<Typography variant="subtitle2">{txn.iat}</Typography>
			</Grid>
			<Grid item xs={12}>
				<Divider variant="fullWidth" />
			</Grid>
			<Grid item xs={6} sx={{ "text-align": "left" }}>
				<Typography variant="subtitle1">APP Opt-In:</Typography>
			</Grid>
			<Grid item xs={6} sx={{ "text-align": "left" }}>
				<Typography variant="body1">ID#{txn.appid}</Typography>
			</Grid>
			<Grid item xs={6} sx={{ "text-align": "left" }}>
				<Typography variant="subtitle1">From:</Typography>
			</Grid>
			<Grid item xs={6} sx={{ "text-align": "left" }}>
				<Typography variant="body1">
					{ParseUtil.displayAddress(txn.base.from)}
				</Typography>
			</Grid>
			<Grid item xs={6} sx={{ "text-align": "left" }}>
				<Typography variant="subtitle1">Fee:</Typography>
			</Grid>
			<Grid item xs={6} sx={{ "text-align": "left" }}>
				<Typography variant="body1">
					{ParseUtil.convertAlgo(txn.base.fee)} <AlgoIcon color="primary" sx={{fontSize: 14}}/>
				</Typography>
			</Grid>

			<Grid item xs={6} sx={{ "text-align": "left" }}>
				<Typography variant="subtitle1">Note:</Typography>
			</Grid>
			<Grid item xs={6} sx={{ "text-align": "left" }}>
				<Typography variant="body1">{txn.base.note}</Typography>
			</Grid>
		</Grid>
	);
}


function DisplayAppCall(txn: AppCall) {
	return (
		<Grid container spacing={1}>
			<Grid item xs={12}>
				<Typography variant="h6">Transaction Details</Typography>
			</Grid>
			<Grid item xs={12}>
				<Typography variant="subtitle2">{txn.iat}</Typography>
			</Grid>
			<Grid item xs={12}>
				<Divider variant="fullWidth" />
			</Grid>
			<Grid item xs={6} sx={{ "text-align": "left" }}>
				<Typography variant="subtitle1">APP Call:</Typography>
			</Grid>
			<Grid item xs={6} sx={{ "text-align": "left" }}>
				<Typography variant="body1">ID#{txn.appid}</Typography>
			</Grid>
			<Grid item xs={6} sx={{ "text-align": "left" }}>
				<Typography variant="subtitle1">From:</Typography>
			</Grid>
			<Grid item xs={6} sx={{ "text-align": "left" }}>
				<Typography variant="body1">
					{ParseUtil.displayAddress(txn.base.from)}
				</Typography>
			</Grid>
			<Grid item xs={6} sx={{ "text-align": "left" }}>
				<Typography variant="subtitle1">Fee:</Typography>
			</Grid>
			<Grid item xs={6} sx={{ "text-align": "left" }}>
				<Typography variant="body1">
					{ParseUtil.convertAlgo(txn.base.fee)} <AlgoIcon color="primary" sx={{fontSize: 14}}/>
				</Typography>
			</Grid>

			<Grid item xs={6} sx={{ "text-align": "left" }}>
				<Typography variant="subtitle1">Note:</Typography>
			</Grid>
			<Grid item xs={6} sx={{ "text-align": "left" }}>
				<Typography variant="body1">{txn.base.note}</Typography>
			</Grid>
		</Grid>
	);
}

export function DisplayTransaction(txn: BaseTransaction) {
	if (txn.type === "payment") {
		return DisplayPayment(txn as PaymentTransaction);
	} else if (txn.type === "asset-optin") {
		return DisplayAssetOptin(txn as AssetOptin);
	} else if (txn.type === "asset-transfer") {
		return DisplayAssetTransfer(txn as AssetTransfer);
	} else if (txn.type === "app-optin") {
		return DisplayAppOptin(txn as AppOptin);
	} else if (txn.type === "app-call") {
		return DisplayAppCall(txn as AppCall);
	} else {
		return <></>;
	}
}