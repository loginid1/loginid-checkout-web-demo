import React, { useState, useRef, useEffect, createElement } from "react";
import { Button, FormControl, Stack } from "@mui/material";
import { AuthService } from "../../../services/auth";
import vaultSDK from "../../../lib/VaultSDK";
import { NewPassControllerProps } from "./PassController";
import { DriversLicensePass as Pass } from "../../../lib/VaultSDK/vault/pass";

interface BlinkidProps {
    handleSuccess: (ev: any) => void
    handleFeedback: (ev: any) => void
}

const BlinkidInBrowser = (props: BlinkidProps) => {
    const ref = useRef<Element>(null);
    const el = createElement("blinkid-in-browser", {
        "license-key": process.env.REACT_APP_MICROBLINK_LICENSE_KEY,
        "engine-location": window.location.origin + "/microblink/resources/",
        "worker-location": window.location.origin + "/microblink/resources/BlinkIDWasmSDK.worker.min.js",
        "recognizers": ["BlinkIdMultiSideRecognizer"],
        ref: ref,
    });

    useEffect(() => {
        const el = ref.current;
        if (el !== null) {
            el.addEventListener('scanSuccess', props.handleSuccess);
            el.addEventListener('feedback', props.handleFeedback);

            return () => {
                el.removeEventListener('scanSuccess', props.handleSuccess);
                el.removeEventListener('feedback', props.handleFeedback);
            };
        }
    }, [ref, props]);

    return el;
}

const DriversLicensePass = (props: NewPassControllerProps): JSX.Element => {
    const [pass, setPass] = useState<Pass | null>(null);

    const handleSuccess = (ev: any) => {
        const data = ev.detail.recognizer

        const passData: Pass = {
            document_number: data.documentNumber.latin,
            document_country: data.classInfo.countryName,
            personal_id_number: data.personalIdNumber.latin,
            full_name: data.fullName.latin,
            address: data.address.latin,
            date_of_birth: new Date(data.dateOfBirth.year, data.dateOfBirth.month-1, data.dateOfBirth.day),
        }

        if (!data.dateOfIssue.empty) {
            passData.date_of_issue = new Date(data.dateOfIssue.year, data.dateOfIssue.month-1, data.dateOfIssue.day)
        }

        if (!data.dateOfExpiry.empty) {
            passData.date_of_expiry = new Date(data.dateOfExpiry.year, data.dateOfExpiry.month-1, data.dateOfExpiry.day)
        }

        console.log(passData);
        setPass(passData);
    }
    const handleFeedback = (ev: any) => {
        // console.log('feedback', ev);
    }

    return (
        <>
            <FormControl fullWidth>
                <BlinkidInBrowser 
                    handleSuccess={handleSuccess} 
                    handleFeedback={handleFeedback}/>
            </FormControl>
            <Stack direction="row" spacing={2} justifyContent="center" alignItems="center">
                <Button variant="text" onClick={() => { props.navigate('/passes'); } }>
                    Cancel
                </Button>
                <Button disabled={pass === null} variant="contained" onClick={async () => {
                    const token = AuthService.getToken();
                    if (token && pass) {
                        try {
                            await vaultSDK.createDriversLicensePass(token, props.name, pass);
                            props.navigate('/passes');
                        } catch (err) {
                            console.error(err);
                        }
                    }
                } }>
                    Finish
                </Button>
            </Stack>
        </>
    )
}

export default DriversLicensePass;
