import React, { useState, useRef, useEffect, createElement } from "react";
import { Box, Button, CircularProgress } from "@mui/material";
import * as BlinkIDSDK from "@microblink/blinkid-in-browser-sdk";

interface BlinkIdElement extends HTMLElement {
    recognizerOptions: { [key: string]: any; };
    translations: { [key: string]: string; };
    scanFromImage: boolean;
    scanFromCamera: boolean;
    startCameraScan: () => Promise<void>;
}

interface BlinkIdProps {
    handleSuccess: (ev: any) => void
    handleFeedback?: (ev: any) => void
}

const BlinkId = (props: BlinkIdProps) => {
    const [blinkIdEl, setBlinkIdEl] = useState<BlinkIdElement|null>(null);
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
        const blinkIdEl = ref.current as BlinkIdElement;
        if (blinkIdEl !== null) {
            // Setup the `BlinkIdMultiSideRecognizer` to return 
            // extra information `FaceImage` and the `FullDocumentImage`
            blinkIdEl.recognizerOptions = {
                "BlinkIdMultiSideRecognizer": {
                    "returnFaceImage": true,
                    "returnFullDocumentImage": true,
                },
            };
            blinkIdEl.scanFromCamera = true;
            blinkIdEl.scanFromImage = false;

            blinkIdEl.addEventListener('ready', () => { setBlinkIdEl(blinkIdEl) });
            blinkIdEl.addEventListener('scanSuccess', props.handleSuccess);
            if (props.handleFeedback !== undefined) {
                blinkIdEl.addEventListener('feedback', props.handleFeedback);
            }

            return () => {
                blinkIdEl.removeEventListener('ready', () => { setBlinkIdEl(blinkIdEl) });
                blinkIdEl.removeEventListener('scanSuccess', props.handleSuccess);
                if (props.handleFeedback !== undefined) {
                    blinkIdEl.removeEventListener('feedback', props.handleFeedback);
                }
            };
        }
    }, [ref, props]);

    return (
        <>
            <Box sx={{visibility: "hidden", height: 0}}>
                {el}
            </Box>
            <Box mb={5} sx={{ display: 'flex', alignContent: 'center', justifyContent: 'center' }}>
                { 
                    blinkIdEl === null ? 
                        <CircularProgress /> : 
                        <Button 
                            variant="contained" 
                            onClick={() => blinkIdEl.startCameraScan()}
                        >
                            Scan Your Document
                        </Button> 
                }
            </Box>
        </>
    );
}

export default BlinkId
