import React, { useState, useEffect } from "react";
import { isDesktop } from "react-device-detect";
import { Stack, Typography, Chip, IconButton, LinearProgress } from "@mui/material";
import { AuthService } from "../../../services/auth";
import vaultSDK from "../../../lib/VaultSDK";
import { NewPassControllerProps } from "./PassController";
import { DriversLicensePass as BasePass } from "../../../lib/VaultSDK/vault/pass";
import DocumentPass from "../../../components/DocumentPass";
import { ContentCopy } from "@mui/icons-material";

let wsurl = process.env.REACT_APP_VAULT_WS_URL

const DriversLicenseDesktopComponent = (props: NewPassControllerProps): JSX.Element => {
    const [link, setLink] = useState<string>("");
    const [qrCode, setQrCode] = useState<string>("");
	const [status, setStatus] = useState<string>("init");

    useEffect(() => {
        const token = AuthService.getToken();
        const getSession = async () => {
            const data = await vaultSDK.driversLicenseMobileInit(token, props.name, props.passType);
            setLink(data.link);
            setQrCode(data.qr_code);
        
            let ws = new WebSocket(
                wsurl + "/api/passes/drivers-license/mobile/ws/" + data.session_id
            );
            // Only render the Link and QR code if the WS is open
            // ws.onopen = (event) => {
            //     console.log("On Open: ", event)
            // };

            // Check for a success message, otherwise retry the DocV and Livness (at least 3 times)
            ws.onmessage = (event) => {
				if (event.data === "session.success") {
                    props.navigate("/passes")
				} else if (event.data === "session.begin") {
					setStatus("scanning");
				} else if (event.data === "session.cancel") {
					setStatus("cancel");
				}
            };
            
            // Retry the connection if the WS closes
            // ws.onclose = (event) => {
            //     console.log("On Close: ", event)
            // };
        };
        getSession();
    }, []);

    return (
        <>

			{status === "init" && (
				<>
					<Typography
						variant="caption"
						color="text.secondary"
						align="left"
					>
						Verify that government IDs are authentic and valid.
					</Typography>
					<Typography variant="caption" color="primary">
						Ready your mobile device:{" "}
					</Typography>
					<img src={qrCode} alt="Add Drivers License" />
					<Typography variant="caption" color="primary">
						{" "}
						Or using the following link:{" "}
					</Typography>
					<Stack
						direction="row"
						justifyContent="center"
						alignItems="center"
                        sx={{ maxWidth: 'sm' }}
					>
						<Chip label={link} size="small" ></Chip>
						<IconButton
							size="small"
							onClick={() => {
								navigator.clipboard.writeText(link);
							}}
						>
							<ContentCopy />
						</IconButton>
					</Stack>
				</>
			)}

			{status === "scanning" && (
				<>
					<LinearProgress />
					<Typography
						variant="caption"
						sx={{ mt: 1, mb: 1 }}
						color="text.secondary"
						align="left"
					>
						Follow the instructions from you mobile device to
						complete the verification process.
					</Typography>

					<Typography
						variant="caption"
						color="text.secondary"
						align="left"
					>
						{" "}
						1. Scan your driver license{" "}
					</Typography>
					<Typography
						sx={{ mb: 2 }}
						variant="caption"
						color="text.secondary"
						align="left"
					>
						{" "}
						2. Match your ID with liveness detection{" "}
					</Typography>
				</>
			)}

			{status === "cancel" && (
				<>
					<Typography
						variant="caption"
						sx={{ mt: 1, mb: 1 }}
						color="text.secondary"
						align="left"
					>
                        You have canceled the document verification process.
					</Typography>

				</>
			)}
        </>
    )
}

const DriversLicensePass = (props: NewPassControllerProps): JSX.Element => {
    const [pass, setPass] = React.useState<BasePass|null>(null);
    const [token, setToken] = useState<string>("");
    const [credentialId, setCredentialId] = useState<string>("");
    const authToken = AuthService.getToken() as string

    if (isDesktop) {
        return <DriversLicenseDesktopComponent {...props}/>
    }

    const handleSuccess = async () => {
        if (authToken && pass) {
            try {
                await vaultSDK.createDriversLicensePass(authToken, props.name, credentialId, token, pass);
                props.navigate('/passes');
            } catch (err) {
                console.error(err);
            }
        }
    };

    return <DocumentPass 
        token={token}
        credentialId={credentialId}
        authToken={AuthService.getToken() as string} 
        handleCancel={() => { props.navigate("/passes");}}
        handleSuccess={handleSuccess}
        passName={props.name}
        passType={props.passType}
        setPass={setPass}
        setToken={setToken}
        setCredentialId={setCredentialId}/>
}

export default DriversLicensePass;
