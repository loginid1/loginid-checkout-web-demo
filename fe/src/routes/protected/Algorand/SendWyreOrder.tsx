import { Alert, AlertColor, LinearProgress } from "@mui/material";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { DisplayMessage } from "../../../lib/common/message";
import wyreSDK from "../../../lib/VaultSDK/sendwyre";
import { AuthService } from "../../../services/auth";

export function SendWyreOrder() {
	const params = useParams();
	const [displayMessage, setDisplayMessage] = useState<DisplayMessage | null>(
		null
	);
	useEffect(() => {
		const address = params["address"];
		if (address != null) {
			orderInit(address);
		} else {
			console.log("no address found");
			// setDisplayMessage
		}
	}, []);
	async function orderInit(address: string) {
		const token = AuthService.getToken();
//		const redirectUrl = window.location.origin + "/fe/sendwyre/callback";
		// temporary disable redirect for now
		const redirectUrl =""
		if (token != null) {
			try {
				const result = await wyreSDK.orderInit(
					token,
					address,
					redirectUrl	
				);
				window.location.replace(result.url);
			} catch (e) {
				console.log(e);
			}
		} else {
			console.log("no auth token found");
		}
	}

	return (
		<div>
			{displayMessage && (
				<Alert
					severity={(displayMessage?.type as AlertColor) || "info"}
					sx={{ mt: 4 }}
				>
					{displayMessage.text}
				</Alert>
			)}
			<LinearProgress />
		</div>
	);
}
