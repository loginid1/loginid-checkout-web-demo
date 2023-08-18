import { Divider, Grid, Typography } from "@mui/material";
import React from "react";
import ParseUtil from "../lib/util/parse";
import { Consent } from "../lib/VaultSDK/vault/user";
import styles from "../styles/common.module.css";

export function DisplayConsents(consents : Consent[]){
    return (

		<Grid container justifyContent="left"  spacing={1} sx={{ mt:1  }}>
            <Grid container item xs={6}><Typography variant="medium">App</Typography></Grid>
            <Grid container item xs={3}><Typography variant="medium">Passes</Typography></Grid>
            <Grid container item xs={3}><Typography variant="medium">Time</Typography></Grid>
            <Grid item xs={12} ><Divider variant="fullWidth" ></Divider></Grid>
            {consents && consents.map((consent)=> (
                DisplayConsent(consent)
            ))}
		</Grid>
    );

}

export function DisplayConsent(consent: Consent) {
    return (
		<React.Fragment key={consent.app_id}>
            <Grid container item xs={6} ><Typography noWrap>{consent.origins}</Typography></Grid>
            <Grid container item xs={3}>{ParseUtil.removeNetworkPrefix(consent.attributes)}</Grid>
            <Grid container item xs={3}>{ParseUtil.parseDateTime(consent.uat)}</Grid>
            <Grid item xs={12} ><Divider variant="fullWidth" ></Divider></Grid>
        </React.Fragment>
    );
}