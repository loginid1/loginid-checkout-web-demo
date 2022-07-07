import { Divider, Grid, Stack, Typography } from "@mui/material";
import ParseUtil from "../lib/util/parse";
import { AssetRecord, EnableAccount } from "../lib/VaultSDK/vault/algo";
import styles from "../styles/common.module.css";

export function DisplayDapps(dapps : EnableAccount[]){
    return (

		<Grid container  sx={{ m:1  }}>
            <Grid item xs={2}><Typography variant="medium">URL</Typography></Grid>
            <Grid item xs={6}><Typography variant="medium">Network</Typography></Grid>
            <Grid item xs={4}><Typography variant="medium">Time</Typography></Grid>
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
            <Grid item xs={2}>{account.dapp_origin}</Grid>
            <Grid item xs={6}>{account.network}</Grid>
            <Grid item xs={4}>{ParseUtil.parseDateTime(account.iat)}</Grid>
        </>
    );
}