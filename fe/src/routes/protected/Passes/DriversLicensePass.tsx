import "@iproov/web";
import moment from "moment";
import React, { useState, useRef, useEffect, createElement } from "react";
import { NavigateFunction } from "react-router";
import { Box, Button, CircularProgress, Grid, Stack, Step, StepContent, StepLabel, Stepper, Typography } from "@mui/material";
import * as BlinkIDSDK from "@microblink/blinkid-in-browser-sdk";
import { AuthService } from "../../../services/auth";
import vaultSDK from "../../../lib/VaultSDK";
import { NewPassControllerProps } from "./PassController";
import { DriversLicensePass as BasePass } from "../../../lib/VaultSDK/vault/pass";

interface Pass extends BasePass {
    image?: ImageData;
}

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

interface IProovWebProps {
    token?: string;
    baseURL?: string;
    credentialId: string;
    handleSuccess: () => void;
    handleRetry: () => Promise<void>;
}

const IProovWeb = (props: React.PropsWithChildren<IProovWebProps>) => {
    const [ready, setReady] = useState(false);
    const [failed, setFailed] = useState(false);

    const ref = useRef<HTMLElement>(null);
    const el = createElement("iproov-me", {
        "token": props.token,
        "base_url": props.baseURL,
        "show_countdown": "true",
        "enable_camera_selector": "true",
        "logo": "",
        ref: ref,
    }, props.children);

    useEffect(() => {
        const handleReady = () => {
            setReady(true);
        };
    
        const handleFailure = (data: any) => {
            if (data.detail.feedback !== 'integration_unloaded') {
                setFailed(true);
                setReady(true);
            }
        }

        const el = ref.current;
        if (el !== null) {
            el.addEventListener('ready', handleReady);
            el.addEventListener('passed', props.handleSuccess);
            el.addEventListener('failed', handleFailure);
            el.addEventListener('error', handleFailure);

            return () => {
                el.removeEventListener('ready', handleReady);
                el.removeEventListener('passed', props.handleSuccess);
                el.removeEventListener('failed', handleFailure);
                el.removeEventListener('error', handleFailure);
            };
        }
    }, [ref, props]);

    const handleRetry = async () => {
        await props.handleRetry();
        setFailed(false);
    }

    return (
        <>
            <Box key={props.token?.slice(0,8)} sx={{ display: ready && !failed ? 'flex' : 'none'}}>
                { el }
            </Box>
            <Stack mb={5} sx={{ display: failed ? 'flex' : 'none', alignContent: 'center', justifyContent: 'center' }}>
                <Typography slot="passed" mb={2} textAlign="center" variant="body2">
                    Success
                </Typography>
                <Typography slot="ready" mb={2} textAlign="center" variant="body2">
                    We were not able to match your face with the picture on your ID.
                </Typography>
                <Box sx={{ display: 'flex', alignContent: 'center', justifyContent: 'center' }}>
                    <Button
                        onClick={handleRetry}
                        variant="contained"
                        sx={{ mt: 1, mr: 1 }}
                    >
                        Retry
                    </Button>
                </Box>
            </Stack>
            <Box mb={5} sx={{ display: ready ? 'none' : 'flex', alignContent: 'center', justifyContent: 'center' }}>
                <CircularProgress />
            </Box>
        </>
    )

}

interface BlinkIdElement extends HTMLElement {
    recognizerOptions: { [key: string]: any; };
    translations: { [key: string]: string; };
    scanFromImage: boolean;
    scanFromCamera: boolean;
}

interface BlinkidProps {
    handleSuccess: (ev: any) => void
    handleFeedback?: (ev: any) => void
}

const BlinkidInBrowser = (props: BlinkidProps) => {
    let settings = new BlinkIDSDK.BlinkIdMultiSideRecognizerSettings()
    settings.returnFaceImage = true;
    
    const ref = useRef<Element>(null);
    const el = createElement("blinkid-in-browser", {
        "license-key": process.env.REACT_APP_MICROBLINK_LICENSE_KEY,
        "engine-location": window.location.origin + "/microblink/resources/",
        "worker-location": window.location.origin + "/microblink/resources/BlinkIDWasmSDK.worker.min.js",
        "recognizers": ["BlinkIdMultiSideRecognizer"],
        ref: ref,
    });

    useEffect(() => {
        const el = ref.current as BlinkIdElement;
        if (el !== null) {
            // Setup the `BlinkIdMultiSideRecognizer` to return 
            // extra information `FaceImage` and the `FullDocumentImage`
            el.recognizerOptions = {
                "BlinkIdMultiSideRecognizer": {
                    "returnFaceImage": true,
                    "returnFullDocumentImage": true,
                },
            };
            el.scanFromCamera = true;
            el.scanFromImage = false;
            el.translations = {
                "action-message": "Scan with your device camera",
            };
            el.addEventListener('scanSuccess', props.handleSuccess);
            if (props.handleFeedback !== undefined) {
                el.addEventListener('feedback', props.handleFeedback);
            }

            return () => {
                el.removeEventListener('scanSuccess', props.handleSuccess);
                if (props.handleFeedback !== undefined) {
                    el.removeEventListener('feedback', props.handleFeedback);
                }
            };
        }
    }, [ref, props]);

    return el;
}

interface IDocumentScanningProps {
    pass: Pass | null;
    navigate: NavigateFunction;
    setPass: React.Dispatch<React.SetStateAction<Pass | null>>;
    setActiveStep: React.Dispatch<React.SetStateAction<number>>;
    setIProovToken: React.Dispatch<React.SetStateAction<string>>;
    setIProovBaseURL: React.Dispatch<React.SetStateAction<string>>;
    setCredentialId: React.Dispatch<React.SetStateAction<string>>;
}

const DocumentScanning = (props: IDocumentScanningProps): JSX.Element => {
    const handleSuccess = async (ev: any) => {
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

        if (passData.full_name === "") {
            passData.full_name = data.firstName.latin + " " + data.lastName.latin
        }

        passData.image = data.faceImage.rawImage as ImageData;
        props.setPass(passData);

        const token = AuthService.getToken();
        if (token) {
            try {
                const blob = await convertImageDataToBlob(passData.image);
                const result = await vaultSDK.iProveClaimEnrolmentToken(token, blob as Blob);
                props.setIProovBaseURL(result.base_url);
                props.setIProovToken(result.token);
                props.setCredentialId(result.credential_id);
            } catch (err) {
                console.error(err);
            }
        }
    }

    const handleNext = async () => {
        props.setActiveStep(step => step + 1);
    };
  
    const handleBack = () => {
        props.navigate('/passes');
    };

    if (!props.pass) {
        return (
            <>
                <BlinkidInBrowser handleSuccess={handleSuccess} />
                <Box sx={{ mb: 2 }}>
                    <Button
                        variant="text"
                        onClick={handleBack}
                        sx={{ mt: 1, mr: 1 }}
                    >
                        Cancel
                    </Button>
                    <Button
                        disabled
                        variant="contained"
                        onClick={handleNext}
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
                <Grid item xl={3} sm={4} xs={12}>
                    <Canvas {...{image: props.pass.image}}/>
                </Grid>
                <Grid item xl={9} sm={8} xs={12}>
                    <Typography display={props.pass.personal_id_number === "" ? "none" : ""} textAlign="left" variant="body2">
                        <strong>ID Number: </strong><br/> {props.pass.personal_id_number}
                    </Typography>
                    <Typography textAlign="left" variant="body2">
                        <strong>Document Number: </strong><br/> {props.pass.document_number}
                    </Typography>
                    <Typography display={props.pass.date_of_birth === undefined ? "none" : ""} textAlign="left" variant="body2">
                        <strong>Date of Birth: </strong><br/> {moment(props.pass.date_of_birth).format("DD/MM/YYYY")}
                    </Typography>
                    <Typography display={props.pass.date_of_issue === undefined ? "none" : ""} textAlign="left" variant="body2">
                        <strong>Issuing Date: </strong><br/> {moment(props.pass.date_of_issue).format("DD/MM/YYYY")}
                    </Typography>
                    <Typography display={props.pass.date_of_expiry === undefined ? "none" : ""} textAlign="left" variant="body2">
                        <strong>Expiry Date: </strong><br/> {moment(props.pass.date_of_expiry).format("DD/MM/YYYY")}
                    </Typography>
                </Grid>
            </Grid>
            <Grid container spacing={2}>
                <Grid item xl={12}>
                    <Typography display={props.pass.full_name === "" ? "none" : ""} textAlign="left" variant="body2">
                        <strong>Name: </strong><br/> {props.pass.full_name}
                    </Typography>
                    <Typography display={props.pass.address === undefined ? "none" : ""} textAlign="left" variant="body2">
                        <strong>Address: </strong><br/> {props.pass.address}
                    </Typography>
                    <Typography display={props.pass.document_country === undefined ? "none" : ""} textAlign="left" variant="body2">
                        <strong>Country: </strong><br/> {props.pass.document_country}
                    </Typography>
                </Grid>
            </Grid>
            <Box sx={{ mb: 2 }}>
                <Button
                    variant="text"
                    onClick={handleBack}
                    sx={{ mt: 1, mr: 1 }}
                >
                    Cancel
                </Button>
                <Button
                    variant="contained"
                    onClick={handleNext}
                    sx={{ mt: 1, mr: 1 }}
                >
                    Continue
                </Button>
            </Box>
        </>
    )
}

interface IFacialScanningProps {
    name: string;
    pass: Pass | null;
    iProovToken: string;
    iProovBaseURL: string;
    credentialId: string;
    navigate: NavigateFunction;
    setActiveStep: React.Dispatch<React.SetStateAction<number>>;
    setIProovToken: React.Dispatch<React.SetStateAction<string>>;
}

const FacialScanning = (props: IFacialScanningProps): JSX.Element => {
    const handleSuccess = async () => {
        const token = AuthService.getToken();
        if (token && props.pass) {
            try {
                const { image, ...pass } = props.pass;
                await vaultSDK.createDriversLicensePass(token, props.name, props.credentialId, props.iProovToken, pass);
                props.navigate('/passes');
            } catch (err) {
                console.error(err);
            }
        }
    };

    const handleRetry = async () => {
        const token = AuthService.getToken();
        if (token) {
            try {
                const result = await vaultSDK.iProveClaimVerificationToken(token, props.credentialId);
                props.setIProovToken(result.token);
            } catch (err) {
                console.error(err);
            }
        }
    }
  
    const handleBack = () => {
        props.navigate('/passes');
    };

    return (
        <>
            <Box mb={5} sx={{ display: 'flex', alignContent: 'center', justifyContent: 'center' }}>
                <IProovWeb 
                    token={props.iProovToken} 
                    baseURL={props.iProovBaseURL}
                    credentialId={props.credentialId}
                    handleSuccess={handleSuccess}
                    handleRetry={handleRetry}
                >
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
                    onClick={handleBack}
                    sx={{ mt: 1, mr: 1 }}
                >
                    Cancel
                </Button>
            </Box>
        </>
    );
}

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

const DriversLicensePass = (props: NewPassControllerProps): JSX.Element => {
    const [pass, setPass] = useState<Pass | null>(null);
    const [activeStep, setActiveStep] = React.useState(0);
    const [iProovToken, setIProovToken] = useState<string>("");
    const [iProovBaseURL, setIProovBaseURL] = useState<string>("");
    const [credentialId, setCredentialId] = useState<string>("");

    const steps = [
        {
            label: 'Scan your drivers license',
            component: <DocumentScanning {...{...props, pass, setPass, setCredentialId, setIProovBaseURL, setIProovToken, setActiveStep}}/>,
        },
        {
            label: 'Scan your face',
            component: <FacialScanning {...{...props, pass, iProovBaseURL, iProovToken, setIProovToken, credentialId, setActiveStep}}/>,
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

export default DriversLicensePass;
