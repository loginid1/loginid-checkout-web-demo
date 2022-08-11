import { Alert, AlertColor, Box, Button, Divider, Grid, LinearProgress, Paper, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { ASAIcon } from "../../../components/ASAIcons";
import { AlgoIcon } from "../../../icons/Common";
import { DisplayMessage } from "../../../lib/common/message";
import ParseUtil from "../../../lib/util/parse";
import wyreSDK, { OrderResponse } from "../../../lib/VaultSDK/sendwyre";
import { AuthService } from "../../../services/auth";

interface OrderCallback {
	status: string;
	orderid: string;
	transferId: string;
	paymentMethodName: string;
	purchaseAmount: string;
	dest: string;
	details: OrderResponse;
}
export function SendWyreCallback() {
	const [params] = useSearchParams();
	const [order, setOrder] = useState<OrderCallback | null>(null);
	console.log(params); // ▶ URLSearchParams {}
	const [displayMessage, setDisplayMessage] = useState<DisplayMessage | null>(
		null
	);
	useEffect(() => {
		const transferId = params.get("transferId");
		if (transferId != null) {
			getOrder(transferId);
			setDisplayMessage({
				text: "Your order is successful",
				type: "info",
			});
		} else {
			setDisplayMessage({
				text: "An error has occured",
				type: "error",
			});
		}
	}, []);

	async function getOrder(transferId: string) {
		try {
			const result = await wyreSDK.track(transferId);
			let orderCallback: OrderCallback = {
				status: params.get("status")!,
				transferId: transferId,
				orderid: params.get("id")!,
				paymentMethodName: ParseUtil.parseWhitespaceQuery(params.get("paymentMethodName")!.toString()),
				purchaseAmount: params.get("purchaseAmount")!,
				dest: ParseUtil.parseSendWyreAddress(params.get("dest")!),
				details: result,
			};
			console.log(ParseUtil.parseWhitespaceQuery(params.get("paymentMethodName")!));
			setOrder(orderCallback);
		} catch (e) {
			console.log(e);
		}
	}

	return (
		<Paper sx={{m:1}}>

		<Grid container spacing={2} >
			{displayMessage && (
				<Grid item xs={12}>
					<Alert
						severity={
							(displayMessage?.type as AlertColor) || "info"
						}
						sx={{}}
					>
						{displayMessage.text}
					</Alert>
				</Grid>
			)}
			{order && DisplayOrderCallback(order)}
			<Grid item xs={12} >
				<Button
					variant="outlined"
					fullWidth
					onClick={() => {
						window.close();
					}}
				>
					CLOSE
				</Button>
			</Grid>
		</Grid>
		</Paper>
	);
}

function DisplayOrderCallback(order: OrderCallback)  {
	return (
		<Grid container sx={{m:1}} item spacing={1} xs={12}>
			<Grid item xs={6} sx={{ "text-align": "left" }}>
				<Typography variant="subtitle1">Status:</Typography>
			</Grid>
			<Grid item xs={6} sx={{ "text-align": "left" }}>
				<Typography variant="body1">
					{`${order.status}`}
				</Typography>
			</Grid>
			<Grid item xs={6} sx={{ "text-align": "left" }}>
				<Typography variant="subtitle1">Order ID</Typography>
			</Grid>
			<Grid item xs={6} sx={{ "text-align": "left" }}>
				<Typography variant="body1">
					{`${order.orderid}`}
				</Typography>
			</Grid>
			<Grid item xs={6} sx={{ "text-align": "left" }}>
				<Typography variant="subtitle1">Order</Typography>
			</Grid>
			<Grid item xs={6} sx={{ "text-align": "left" }}>
				<Typography variant="body1">
					{`${order.details.destAmount} ${order.details.destCurrency}`}
				</Typography>
			</Grid>
			<Grid item xs={6} sx={{ "text-align": "left" }}>
				<Typography variant="subtitle1">To My Account:</Typography>
			</Grid>
			<Grid item xs={6} sx={{ "text-align": "left" }}>
				<Typography variant="body1">
					{ParseUtil.displayLongAddress(ParseUtil.parseSendWyreAddress(order.details.destSrn))}
				</Typography>
			</Grid>
            <Grid item xs={12} ><Divider variant="fullWidth" ></Divider></Grid>
			<Grid item xs={6} sx={{ "text-align": "left" }}>
				<Typography variant="subtitle1">Payment Method:</Typography>
			</Grid>
			<Grid item xs={6} sx={{ "text-align": "left" }}>
				<Typography variant="body1">
					{order.paymentMethodName}
				</Typography>
			</Grid>
			<Grid item xs={6} sx={{ "text-align": "left" }}>
				<Typography variant="subtitle1">Amount:</Typography>
			</Grid>
			<Grid item xs={6} sx={{ "text-align": "left" }}>
				<Typography variant="body1">
					{`${order.purchaseAmount} ${order.details.sourceCurrency}`}
				</Typography>
			</Grid>
			<Grid item xs={6} sx={{ "text-align": "left" }}>
				<Typography variant="subtitle1">Fee:</Typography>
			</Grid>
			<Grid item xs={6} sx={{ "text-align": "left" }}>
				<Typography variant="body1">
					{`${order.details.fee} ${order.details.feeCurrency}`}
				</Typography>
			</Grid>
			<Grid item xs={6} sx={{ "text-align": "left" }}>
				<Typography variant="subtitle1">Total:</Typography>
			</Grid>
			<Grid item xs={6} sx={{ "text-align": "left" }}>
				<Typography variant="body1">
					{`${order.details.sourceAmount} ${order.details.sourceCurrency}`}
				</Typography>
			</Grid>

		</Grid>
	);
}
