import { Divider, Grid, Stack, Typography } from "@mui/material";
import ParseUtil from "../lib/util/parse";
import { AssetRecord, EnableAccount } from "../lib/VaultSDK/vault/algo";
import styles from "../styles/common.module.css";

export function DisplayDapps(dapps : EnableAccount[]){
    return (

		<Grid container justifyContent="left"  spacing={1} sx={{ mt:1  }}>
            <Grid container item xs={6}><Typography variant="medium">URL</Typography></Grid>
            <Grid container item xs={3}><Typography variant="medium">Network</Typography></Grid>
            <Grid container item xs={3}><Typography variant="medium">Time</Typography></Grid>
            <Grid item xs={12} ><Divider variant="fullWidth" ></Divider></Grid>
            {dapps && dapps.map((dapp)=> (
                DisplayShortDapp(dapp)
            ))}
		</Grid>
    );

}

export function DisplayShortDapp(account: EnableAccount) {
    return (
        <>
            <Grid container item xs={6} ><Typography noWrap>{account.dapp_origin}</Typography></Grid>
            <Grid container item xs={3}>{ParseUtil.removeNetworkPrefix(account.network)}</Grid>
            <Grid container item xs={3}>{ParseUtil.parseDateTime(account.iat)}</Grid>
            <Grid item xs={12} ><Divider variant="fullWidth" ></Divider></Grid>
        </>
    );
}