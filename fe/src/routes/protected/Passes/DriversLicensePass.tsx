import React, { useState, useEffect } from "react";
import { isDesktop } from "react-device-detect";
import { Stack, Typography, Chip, IconButton } from "@mui/material";
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
                console.log("On Message: ", event)
                props.navigate("/passes")
            };
            
            // Retry the connection if the WS closes
            // ws.onclose = (event) => {
            //     console.log("On Close: ", event)
            // };
        };
        getSession();

    }, [props, setLink, setQrCode]);

    return (
        <>
            <Typography variant="body1" color="primary" >Go to following link on your new device: </Typography>
            <Stack direction="row">
            <Chip label={link}></Chip>
                <IconButton size="small" onClick={()=>{ navigator.clipboard.writeText(link); }}>
                    <ContentCopy />
                </IconButton>
            </Stack>
            <Typography variant="body1" color="primary">or use following QR code: </Typography>
            <img src={qrCode} alt="Add Drivers License" />
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
