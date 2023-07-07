import React, { useState, useEffect } from "react";
import { isDesktop } from "react-device-detect";
import { Stack, Typography, Chip, IconButton, CircularProgress, Button } from "@mui/material";
import { AuthService } from "../../../services/auth";
import vaultSDK from "../../../lib/VaultSDK";
import { NewPassControllerProps } from "./PassController";
import { DriversLicensePass as BasePass } from "../../../lib/VaultSDK/vault/pass";
import DocumentPass from "../../../components/DocumentPass";
import { ContentCopy } from "@mui/icons-material";

let wsurl = process.env.REACT_APP_VAULT_WS_URL
const initialTimer = 180;

const getMinutes = (seconds: number): string => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60
    
    if (sec < 10) {
        return `${min}:0${sec}`;
    }
    return `${min}:${sec}`;
}

const DriversLicenseDesktopComponent = (props: NewPassControllerProps): JSX.Element => {
    const [retryAttempts, setRetryAttempts] = useState(2);
    const [timer, setTimer] = useState(initialTimer);
    const [link, setLink] = useState<string>("");
    const [qrCode, setQrCode] = useState<string>("");

    useEffect(() => {
        if (timer > 0) {
            setTimeout(() => setTimer(timer - 1), 1000);
        } else if (retryAttempts !== 0) {
            setRetryAttempts(retryAttempts - 1);
            setTimer(initialTimer)
        }
    }, [timer, retryAttempts]);

    useEffect(() => {
        const getSession = async () => {
            const token = AuthService.getToken();
            const data = await vaultSDK.driversLicenseMobileInit(token, props.name, props.passType);

            setLink(data.link);
            setQrCode(data.qr_code);
        
            let ws = new WebSocket(
                wsurl + "/api/passes/drivers-license/mobile/ws/" + data.session_id
            );

            // Check for a success message, otherwise retry the DocV and Livness (at least 3 times)
            ws.onmessage = (event) => {
                console.log("On Message: ", event)
                props.navigate("/passes")
            };
        };

        if (timer === initialTimer) {
            getSession();
        }

    }, [props, timer]);

    if (link === "" || qrCode === "") {
        return <CircularProgress />
    }

    const handleCancelation = () => {
        
    }

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
            <Typography
                variant="subtitle2"
                color="rgba(0,0,0,0.5)"
                sx={{ mb: 2, visibility: timer !== 0 ? "visible" : "hidden" }}
            >
                session expires in <strong>{getMinutes(timer)} minutes</strong>
            </Typography>
            <Button
                onClick={handleCancelation}
                variant="text"
                sx={{ mt: 1, mr: 1 }}
            >
                Cancel
            </Button>
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
