import { Step, StepContent, StepLabel, Stepper } from "@mui/material";
import React, { useState } from "react";
import DocumentScanning, { DocumentData } from "./DocumentScanning"
import FacialScanning from "./FacialScanning"
import vaultSDK from "../lib/VaultSDK";
import { DriversLicensePass } from "../lib/VaultSDK/vault/pass";

const convertImageDataToBlob = async (imageData?: ImageData): Promise<Blob | null> => {
    if (!imageData) {
        return null;
    }
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    context?.putImageData(imageData, 0, 0);
  
    return new Promise((resolve) => {
        canvas.toBlob((blob) => {
            resolve(blob);
        });
    });
};

interface DocumentPassProps {
    passName: string;
    passType: string;
    authToken: string;
    token: string;
    credentialId: string;
    handleSuccess: () => void;
    handleCancel: () => void;
    setPass: React.Dispatch<React.SetStateAction<DriversLicensePass | null>>
    setToken: React.Dispatch<React.SetStateAction<string>>
    setCredentialId: React.Dispatch<React.SetStateAction<string>>
}

const DocumentPass = (props: DocumentPassProps): JSX.Element => {
    const [activeStep, setActiveStep] = React.useState(0);
    const [baseUrl, setBaseURL] = useState<string>("");

    const documentScanningSuccess = async (data: DocumentData) => {
        props.setPass({
            document_number: data.documentNumber,
            document_country: data.documentCountry,
            full_name: data.fullName,
            personal_id_number: data.personalIdNumber,
            address: data.address,
            date_of_birth: data.dateOfBirth,
            date_of_issue: data.dateOfIssue,
            date_of_expiry: data.dateOfExpiry
        })
        try {
            const blob = await convertImageDataToBlob(data.image);
            const result = await vaultSDK.iProveClaimEnrolmentToken(props.authToken, blob as Blob);
            setBaseURL(result.base_url);
            props.setToken(result.token);
            props.setCredentialId(result.credential_id);
        } catch (err) {
            console.error(err);
        }
    }

    const handleRetry = async () => {
        try {
            const result = await vaultSDK.iProveClaimVerificationToken(props.authToken, props.credentialId);
            props.setToken(result.token);
        } catch (err) {
            console.error(err);
        }
    }

    const steps = [
        {
            label: 'Scan your drivers license',
            component: <DocumentScanning 
                handleSuccess={documentScanningSuccess} 
                handleBack={props.handleCancel}
                handleNext={() => { setActiveStep(step => step + 1); }} />,
        },
        {
            label: 'Scan your face',
            component: <FacialScanning 
                baseURL={baseUrl}
                token={props.token}
                handleSuccess={props.handleSuccess}
                handleBack={props.handleCancel}
                handleRetry={handleRetry} />,
        }
    ];

    return (
        <>
            <Stepper activeStep={activeStep} orientation="vertical" sx={{width: "100%"}}>
                { steps.map(step => (
                    <Step key={step.label}>
                        <StepLabel>
                            { step.label }
                        </StepLabel>
                        <StepContent>
                            { step.component }
                        </StepContent>
                    </Step>
                ))}
            </Stepper>
            <div></div>
        </>
    )
}

export default DocumentPass
