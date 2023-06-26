import { Box, Button, Typography } from "@mui/material";
import React from "react";
import IProovWeb, { IProovWebProps } from "./IProovWeb";

interface FacialScanningProps extends IProovWebProps {
    // name: string;
    // pass: Pass | null;
    // iProovToken: string;
    // iProovBaseURL: string;
    // credentialId: string;
    // navigate: NavigateFunction;
    // setActiveStep: React.Dispatch<React.SetStateAction<number>>;
    // setIProovToken: React.Dispatch<React.SetStateAction<string>>;
    // handleSuccess: () => {}
    handleBack: () => void
}

const FacialScanning = (props: FacialScanningProps): JSX.Element => {
    // const handleSuccess = async () => {
    //     const token = AuthService.getToken();
    //     if (token && props.pass) {
    //         try {
    //             const { image, ...pass } = props.pass;
    //             await vaultSDK.createDriversLicensePass(token, props.name, props.credentialId, props.iProovToken, pass);
    //             props.navigate('/passes');
    //         } catch (err) {
    //             console.error(err);
    //         }
    //     }
    // };

    // const handleRetry = async () => {
    //     const token = AuthService.getToken();
    //     if (token) {
    //         try {
    //             const result = await vaultSDK.iProveClaimVerificationToken(token, props.credentialId);
    //             props.setIProovToken(result.token);
    //         } catch (err) {
    //             console.error(err);
    //         }
    //     }
    // }
  
    // const handleBack = () => {
    //     props.navigate('/passes');
    // };

    return (
        <>
            <Box mb={5} sx={{ display: 'flex', alignContent: 'center', justifyContent: 'center' }}>
                <IProovWeb {...props}>
                    <Typography slot="ready" mb={2} textAlign="center" variant="body2">
                        The last step is to scan your face in order to prove the picture in the document is you
                    </Typography>
                    <Button slot="button" variant="contained">
                        Scan your face
                    </Button>
                </IProovWeb>
            </Box>
            <Box sx={{ mb: 2 }}>
                <Button
                    variant="text"
                    onClick={props.handleBack}
                    sx={{ mt: 1, mr: 1 }}
                >
                    Cancel
                </Button>
            </Box>
        </>
    );
}

export default FacialScanning
