import { Box, Button, Grid, Typography } from "@mui/material";
import React, { useEffect, useRef, useState } from "react";
import moment from "moment";
import BlinkId from "./BlinkIdWeb";

interface CanvasProps {
    image?: ImageData | null;
}

const Canvas = (props: CanvasProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas !== null && props.image !== null) {
            const context = canvas.getContext('2d');
        
            if (context !== null && props.image) {
                context.putImageData(props.image, 0, 0);
            }
        }
    }, [props]);

    return <canvas 
        width={props.image?.width} 
        height={props.image?.height}
        style={{width: "100%"}}
        ref={canvasRef} />;
};

interface DocumentData {
    image?: ImageData;
    documentNumber: string;
    documentCountry?: string;
    personalIdNumber?: string;
    fullName?: string;
    address?: string;
    dateOfBirth: Date;
    dateOfIssue?: Date;
    dateOfExpiry?: Date;
}

interface DocumentScanningProps {
    handleSuccess: (ev: DocumentData) => void
    handleNext: () => void
    handleBack: () => void
    // pass: Pass | null;
    // navigate: NavigateFunction;
    // setPass: React.Dispatch<React.SetStateAction<Pass | null>>;
    // setActiveStep: React.Dispatch<React.SetStateAction<number>>;
    // setIProovToken: React.Dispatch<React.SetStateAction<string>>;
    // setIProovBaseURL: React.Dispatch<React.SetStateAction<string>>;
    // setCredentialId: React.Dispatch<React.SetStateAction<string>>;
}

const DocumentScanning = (props: DocumentScanningProps): JSX.Element => {
    const [document, setDocument] = useState<DocumentData|null>(null);
    const handleSuccess = async (ev: any) => {
        const data = ev.detail.recognizer

        const doc: DocumentData = {
            documentNumber: data.documentNumber.latin,
            documentCountry: data.classInfo.countryName,
            personalIdNumber: data.personalIdNumber.latin,
            fullName: data.fullName.latin,
            address: data.address.latin,
            dateOfBirth: new Date(data.dateOfBirth.year, data.dateOfBirth.month-1, data.dateOfBirth.day),
        }

        if (!data.dateOfIssue.empty) {
            doc.dateOfIssue = new Date(data.dateOfIssue.year, data.dateOfIssue.month-1, data.dateOfIssue.day)
        }

        if (!data.dateOfExpiry.empty) {
            doc.dateOfExpiry = new Date(data.dateOfExpiry.year, data.dateOfExpiry.month-1, data.dateOfExpiry.day)
        }

        if (doc.fullName === "") {
            doc.fullName = data.firstName.latin + " " + data.lastName.latin
        }

        doc.image = data.faceImage.rawImage as ImageData;
        setDocument(doc);

        props.handleSuccess(doc)
    }
    // const handleSuccess = async (ev: any) => {
    //     const data = ev.detail.recognizer

    //     const passData: Pass = {
    //         document_number: data.documentNumber.latin,
    //         document_country: data.classInfo.countryName,
    //         personal_id_number: data.personalIdNumber.latin,
    //         full_name: data.fullName.latin,
    //         address: data.address.latin,
    //         date_of_birth: new Date(data.dateOfBirth.year, data.dateOfBirth.month-1, data.dateOfBirth.day),
    //     }

    //     if (!data.dateOfIssue.empty) {
    //         passData.date_of_issue = new Date(data.dateOfIssue.year, data.dateOfIssue.month-1, data.dateOfIssue.day)
    //     }

    //     if (!data.dateOfExpiry.empty) {
    //         passData.date_of_expiry = new Date(data.dateOfExpiry.year, data.dateOfExpiry.month-1, data.dateOfExpiry.day)
    //     }

    //     if (passData.full_name === "") {
    //         passData.full_name = data.firstName.latin + " " + data.lastName.latin
    //     }

    //     passData.image = data.faceImage.rawImage as ImageData;
    //     props.setPass(passData);

    //     const token = AuthService.getToken();
    //     if (token) {
    //         try {
    //             const blob = await convertImageDataToBlob(passData.image);
    //             const result = await vaultSDK.iProveClaimEnrolmentToken(token, blob as Blob);
    //             props.setIProovBaseURL(result.base_url);
    //             props.setIProovToken(result.token);
    //             props.setCredentialId(result.credential_id);
    //         } catch (err) {
    //             console.error(err);
    //         }
    //     }
    // }

    // const handleNext = async () => {
    //     props.setActiveStep(step => step + 1);
    // };
  
    // const handleBack = () => {
    //     props.navigate('/passes');
    // };



    if (!document) {
        return (
            <>
                <BlinkId handleSuccess={handleSuccess} />
                <Box sx={{ mb: 2 }}>
                    <Button
                        variant="text"
                        onClick={props.handleBack}
                        sx={{ mt: 1, mr: 1 }}
                    >
                        Cancel
                    </Button>
                    <Button
                        disabled
                        variant="contained"
                        onClick={props.handleNext}
                        sx={{ mt: 1, mr: 1 }}
                    >
                        Continue
                    </Button>
                </Box>
            </>
        )
    }

    return (
        <>
            <Grid container spacing={2}>
                <Grid item xl={3} sm={4} xs={6}>
                    <Canvas {...{image: document.image}}/>
                </Grid>
                <Grid item xl={9} sm={8} xs={12}>
                    <Typography display={document.personalIdNumber === "" ? "none" : ""} textAlign="left" variant="body2">
                        <strong>ID Number: </strong><br/> {document.personalIdNumber}
                    </Typography>
                    <Typography textAlign="left" variant="body2">
                        <strong>Document Number: </strong><br/> {document.documentNumber}
                    </Typography>
                    <Typography display={document.dateOfBirth === undefined ? "none" : ""} textAlign="left" variant="body2">
                        <strong>Date of Birth: </strong><br/> {moment(document.dateOfBirth).format("DD/MM/YYYY")}
                    </Typography>
                    <Typography display={document.dateOfIssue === undefined ? "none" : ""} textAlign="left" variant="body2">
                        <strong>Issuing Date: </strong><br/> {moment(document.dateOfIssue).format("DD/MM/YYYY")}
                    </Typography>
                    <Typography display={document.dateOfExpiry === undefined ? "none" : ""} textAlign="left" variant="body2">
                        <strong>Expiry Date: </strong><br/> {moment(document.dateOfExpiry).format("DD/MM/YYYY")}
                    </Typography>
                </Grid>
            </Grid>
            <Grid container spacing={2}>
                <Grid item xl={12}>
                    <Typography display={document.fullName === "" ? "none" : ""} textAlign="left" variant="body2">
                        <strong>Name: </strong><br/> {document.fullName}
                    </Typography>
                    <Typography display={document.address === undefined ? "none" : ""} textAlign="left" variant="body2">
                        <strong>Address: </strong><br/> {document.address}
                    </Typography>
                    <Typography display={document.documentCountry === undefined ? "none" : ""} textAlign="left" variant="body2">
                        <strong>Country: </strong><br/> {document.documentCountry}
                    </Typography>
                </Grid>
            </Grid>
            <Box sx={{ mb: 2 }}>
                <Button
                    variant="text"
                    onClick={props.handleBack}
                    sx={{ mt: 1, mr: 1 }}
                >
                    Cancel
                </Button>
                <Button
                    variant="contained"
                    onClick={props.handleNext}
                    sx={{ mt: 1, mr: 1 }}
                >
                    Continue
                </Button>
            </Box>
        </>
    )
}

export type { DocumentData }
export default DocumentScanning
