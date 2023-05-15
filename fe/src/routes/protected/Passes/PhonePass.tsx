import { Button, FormControl, Stack, TextField, Typography } from "@mui/material";
import React, { useState, useEffect } from "react";
import { AuthService } from "../../../services/auth";
import vaultSDK from "../../../lib/VaultSDK";
import { ArrowBack, Refresh } from "@mui/icons-material";
import { NewPassControllerProps } from "./PassController";

const PhonePass = (props: NewPassControllerProps): JSX.Element => {
    const [code, setCode] = useState('');
    const [verifyInit, setVerifyInit] = useState(false);
    const [timer, setTimer] = useState(45);
    const [phoneNumber, setPhoneNumber] = useState("");


    useEffect(() => {
        timer > 0 && verifyInit && setTimeout(() => setTimer(timer - 1), 1000);
    }, [timer, verifyInit]);
    
    return (
        <>
            <FormControl fullWidth>
                <TextField
                    fullWidth
                    disabled={verifyInit}
                    label="Phone number"
                    value={phoneNumber}
                    onChange={e => setPhoneNumber(e.target.value)}
                    sx={{ mb: 2 }} />
                <TextField
                    fullWidth
                    label="Code"
                    value={code}
                    onChange={e => e.target.value.length <= 6 && setCode(e.target.value.toUpperCase())}
                    sx={{ mb: 2, visibility: verifyInit ? "visible" : "hidden" }} />
                <Typography
                    variant="subtitle2"
                    color="rgba(0,0,0,0.5)"
                    sx={{ mb: 2, visibility: verifyInit && timer !== 0 ? "visible" : "hidden" }}
                >
                    resend code in <strong>{timer} seconds</strong>
                </Typography>
                <Button
                    variant="text"
                    size="small"
                    sx={{ visibility: verifyInit && timer === 0 ? "visible" : "hidden" }}
                    onClick={async () => {
                        const token = AuthService.getToken();
                        if (token) {
                            try {
                                setTimer(45);
                                await vaultSDK.createPhonePassInit(token, phoneNumber);
                                setVerifyInit(true);
                            } catch (err) {
                                console.error(err);
                            }
                        }
                    } }>
                    <Refresh />
                    Resend code
                </Button>
            </FormControl>
            <Stack display={verifyInit ? "none" : ""} direction="row" spacing={2} justifyContent="center" alignItems="center">
                <Button variant="text" onClick={() => { props.setActiveStep(1); } }>
                    <ArrowBack />
                    Back
                </Button>
                <Button disabled={phoneNumber.length < 10} variant="contained" onClick={async () => {
                    const token = AuthService.getToken();
                    if (token) {
                        try {
                            await vaultSDK.createPhonePassInit(token, phoneNumber);
                            setVerifyInit(true);
                        } catch (err) {
                            console.error(err);
                        }
                    }
                } }>
                    Next
                </Button>
            </Stack>
            <Stack display={verifyInit ? "" : "none"} direction="row" spacing={2} justifyContent="center" alignItems="center">
                <Button variant="text" onClick={() => { props.navigate('/passes'); } }>
                    Cancel
                </Button>
                <Button disabled={code.length !== 6} variant="contained" onClick={async () => {
                    const token = AuthService.getToken();
                    if (token) {
                        try {
                            await vaultSDK.createPhonePassComplete(token, props.name, phoneNumber, code);
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

export default PhonePass;
