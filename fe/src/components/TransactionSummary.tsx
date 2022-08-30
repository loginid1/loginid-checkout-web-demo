import { Divider, Grid, Stack, Typography } from "@mui/material";
import ParseUtil from "../lib/util/parse";
import { TxRecord } from "../lib/VaultSDK/vault/algo";
import styles from "../styles/common.module.css";


export function DisplayTransactionTab(records: TxRecord[], address: string) {

    return (

		<Grid container spacing={1} sx={{ mt:1  }}>
            <Grid item container xs={2}><Typography variant="medium" align="left">Type</Typography></Grid>
            <Grid item container xs={6}><Typography variant="medium" align="left">Action</Typography></Grid>
            <Grid item container xs={4}><Typography variant="medium" align="left">Time</Typography></Grid>
            <Grid item xs={12} ><Divider variant="fullWidth" ></Divider></Grid>
            {records && records.map((tx)=> (
                DisplayShortTransaction(tx,address)
            ))}
		</Grid>
    );
}

export function DisplayShortTransaction(record: TxRecord, address: string) {
    let summary = "";
    let action = "recieve ";
    if (record.sender === address) {
        action = "send ";
    } else if (record["rekey-to"] != null ) {
        summary = "rekey";
    } 
    let type = "ALGO";
    if (record["tx-type"] === "axfer" && record["asset-transfer-transaction"]) {
        type = "ASA";
        if (record.sender === record["asset-transfer-transaction"].receiver) {
            action = "opt-in";
            summary = "to ASA#" + record["asset-transfer-transaction"]["asset-id"];
        } else {
            summary = record["asset-transfer-transaction"].amount + " ASA#"+record["asset-transfer-transaction"]["asset-id"];
        }
    } else if (record["tx-type"] === "pay" && record["payment-transaction"]!= null) {
        if (record["rekey-to"] != null ) {
            action = "rekey to"
            summary = ParseUtil.displayAddress(record["rekey-to"]);
        } else {
            summary =  ParseUtil.convertAlgo(record["payment-transaction"].amount) + " Algo";
        }
    } else if (record["tx-type"] === "appl" && record["application-transaction"]) {
        if (record["application-transaction"]["on-completion"] == "noop") {
            action = "call";
            summary = "APP#"+record["application-transaction"]["application-id"];
        } else {
            action = record["application-transaction"]["on-completion"]
            summary = "APP#"+record["application-transaction"]["application-id"] ;
        }
    }
    return (

		<Grid container sx={{m:1}} alignItems="flex-end" columns={12} >
            <Grid item container xs={2}><Typography variant="body1" align="left">{action}</Typography></Grid>
            <Grid item container xs={6}><Typography variant="body1" align="left">{summary}</Typography></Grid>
            <Grid item container xs={4}><Typography variant="body1" align="left">{ParseUtil.parseDateTimeUnix(record["round-time"])}</Typography></Grid>
            <Grid item xs={12} ><Divider variant="fullWidth" ></Divider></Grid>
		</Grid>
    );
}

export function DisplayTransactions(records: TxRecord[], address: string) {

    return (

		<Grid container  sx={{ mt:1  }}>
            <Grid item container xs={2}><Typography variant="medium" align="left">Time</Typography></Grid>
            <Grid item container xs={2}><Typography variant="medium" align="left">Fee</Typography></Grid>
            <Grid item container xs={6}><Typography variant="medium" align="left">Description</Typography></Grid>
            <Grid item xs={12} ><Divider variant="fullWidth" ></Divider></Grid>
            {records && records.map((tx)=> (
                DisplayLongTransaction(tx,address)
            ))}
		</Grid>
    );
}

export function DisplayLongTransaction(record: TxRecord, address: string) {
    let summary = "";
    let action = "recieve ";
    if (record.sender === address) {
        action = "send ";
    } else if (record["rekey-to"] != null ) {
        summary = "rekey";
    } 
    let type = "ALGO";
    if (record["tx-type"] === "axfer" && record["asset-transfer-transaction"]) {
        type = "ASA";
        if (record.sender === record["asset-transfer-transaction"].receiver) {
            action = "opt-in";
            summary = "to ASA#" + record["asset-transfer-transaction"]["asset-id"];
        } else {
            summary = record["asset-transfer-transaction"].amount + " ASA#"+record["asset-transfer-transaction"]["asset-id"];
        }
    } else if (record["tx-type"] === "pay" && record["payment-transaction"]!= null) {
        if (record["rekey-to"] != null ) {
            action = "rekey to"
            summary = ParseUtil.displayAddress(record["rekey-to"]);
        } else {
            summary =  ParseUtil.convertAlgo(record["payment-transaction"].amount) + " Algo";
        }
    } else if (record["tx-type"] === "appl" && record["application-transaction"]) {
        if (record["application-transaction"]["on-completion"] == "noop") {
            action = "call";
            summary = "APP#"+record["application-transaction"]["application-id"];
        } else {
            action = record["application-transaction"]["on-completion"]
            summary = "APP#"+record["application-transaction"]["application-id"] ;
        }
    }
    return (

		<Grid container className={styles.txBox} sx={{mt:1}} spacing={1} alignItems="flex-end" columns={12} >
            <Grid item xs={2}  ><Typography variant="caption" align="left">{ParseUtil.parseDateTimeUnix(record["round-time"])}</Typography></Grid>
            <Grid item xs={2}><Typography variant="body1"   align="left">{ParseUtil.convertAlgo(record.fee)}</Typography></Grid>
            <Grid item container xs={6}><Typography variant="medium" align="left">{action} &nbsp;</Typography><Typography variant="body1"   align="left">{summary}</Typography></Grid>
		</Grid>
    );
}