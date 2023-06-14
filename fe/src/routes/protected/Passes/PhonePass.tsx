import { Button, FormControl, Stack, Typography } from "@mui/material";
import { ArrowBack, Refresh } from "@mui/icons-material";
import React, { useState, useEffect } from "react";
import PhoneInput from "react-phone-input-2";
import ReactCodeInput from "react-code-input";
import { AuthService } from "../../../services/auth";
import vaultSDK from "../../../lib/VaultSDK";
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
                <PhoneInput
                    inputStyle={{
                        width: "100%",
                        height: "50px",
                        fontSize: "15px",
                        borderRadius: "5px",
                        marginBottom: "10px",
                    }}
                    enableLongNumbers
                    country={"us"}
                    disabled={verifyInit}
                    value={phoneNumber}
                    onChange={value => setPhoneNumber("+" + value)}
                />
                { verifyInit && (
                    <ReactCodeInput
                        type="text"
                        fields={6}
                        name="code"
                        inputMode="numeric"
                        onChange={(value: string) => setCode(value)}
                        pattern="^[0-9]+$|^$"
                        inputStyle={{
                            font: "inherit",
                            letterSpacing: "inherit",
                            color: "currentcolor",
                            padding: "16.5px 14px",
                            margin: "25px 5px",
                            width: "54px",
                            textAlign: "center"
                        }}
                    />
                )}
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
