import { Divider, Grid, Stack, Typography } from "@mui/material";
import ParseUtil from "../lib/util/parse";
import { AssetRecord } from "../lib/VaultSDK/vault/algo";
import styles from "../styles/common.module.css";

export function DisplayAssets(assets : AssetRecord[]){
    return (

		<Grid container  sx={{ m:1  }}>
            <Grid item xs={2}><Typography variant="medium">ID</Typography></Grid>
            <Grid item xs={6}><Typography variant="medium">Name</Typography></Grid>
            <Grid item xs={4}><Typography variant="medium">Balance</Typography></Grid>
            <Grid item xs={12} ><Divider variant="fullWidth" ></Divider></Grid>
            {assets && assets.map((asset)=> (
                DisplayShortAsset(asset)
            ))}
		</Grid>
    );

}

export function DisplayShortAsset(asset: AssetRecord) {
    return (
        <>
            <Grid item xs={2}>{asset.id}</Grid>
            <Grid item xs={6}>{asset.name}</Grid>
            <Grid item xs={4}>{asset.amount}</Grid>
        </>
    );
}