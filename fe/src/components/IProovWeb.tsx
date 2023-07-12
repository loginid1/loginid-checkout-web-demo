import "@iproov/web";
import React, { useState, useRef, useEffect, createElement } from "react";
import { Box, Button, CircularProgress, Stack } from "@mui/material";


interface IProovWebProps {
    token?: string;
    baseURL?: string;
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
            <Box key={props.token?.slice(0,8)} sx={{ display:  !failed ? 'flex' : 'none'}}>
                { el }
            </Box>
            <Stack mb={5} sx={{ display: failed ? 'flex' : 'none', alignContent: 'center', justifyContent: 'center' }}>
                {/* TODO: Review the `passed` and the `ready` slots */}
                {/* <Typography slot="passed" mb={2} textAlign="center" variant="body2">
                    Success
                </Typography>
                <Typography slot="ready" mb={2} textAlign="center" variant="body2">
                    We were not able to match your face with the picture on your ID.
                </Typography> */}
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
            {/**
            <Box mb={5} sx={{ display: ready ? 'none' : 'flex', alignContent: 'center', justifyContent: 'center' }}>
                <CircularProgress />
            </Box>
             */}
        </>
    )
}

export type { IProovWebProps }
export default IProovWeb
