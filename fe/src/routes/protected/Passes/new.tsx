import { ArrowBack, Refresh } from "@mui/icons-material";
import {
	Stack,
	Button,
	Grid,
	Typography,
	Paper,
	TextField,
    FormControl,
    FormLabel,
    RadioGroup,
    FormControlLabel,
    Radio,
    Stepper,
    Step,
    StepLabel,
} from "@mui/material";
import React, { useState, useEffect } from "react";
import { NavigateFunction, useNavigate } from "react-router-dom";
import { VaultBase } from "../../../components/VaultBase";
import { ReactComponent as ProfileDefault } from "../../../assets/sidemenu/DIDs/Default.svg";
import vaultSDK from "../../../lib/VaultSDK";
import { AuthService } from "../../../services/auth";
import { SDKError } from "../../../lib/VaultSDK/utils/errors";

interface NewPassNameProps {
    navigate: NavigateFunction;
    setActiveStep: React.Dispatch<React.SetStateAction<number>>;
    name: string;
    setName: React.Dispatch<React.SetStateAction<string>>;
}

const NewPassName = (props: NewPassNameProps) => {
    return (
        <>
            <ProfileDefault width={50} height={50} />
            <Typography
                variant="h2"
                color="secondary"
                sx={{ padding: { md: 4, xs: 2 } }}
            >
                Create a new Pass
            </Typography>
            <TextField
                fullWidth
                label="Chose a name"
                value={props.name}
                onChange={e => props.setName(e.target.value)}
            />
            <Stack direction="row" spacing={2} justifyContent="center" alignItems="center">
                <Button variant="text" onClick={() => { props.navigate('/passes') }}>
                    <ArrowBack/>
                    Back
                </Button>
                <Button disabled={ props.name.length < 3 } variant="contained" onClick={() => { props.setActiveStep(1) }}>
                    Next
                </Button>
            </Stack>
        </>
    )
}

interface NewPassTypeProps {
    setActiveStep: React.Dispatch<React.SetStateAction<number>>;
}

const NewPassType = (props: NewPassTypeProps) => {
    return (
        <>
            <div></div>
            <FormControl>
                <FormLabel id="pass-selector">Type</FormLabel>
                <RadioGroup
                    row
                    aria-labelledby="pass-selector"
                    name="pass"
                    value="phone"
                >
                    <FormControlLabel disabled value="email" control={<Radio />} label="Email" />
                    <FormControlLabel  value="phone" control={<Radio />} label="Phone Number" />
                </RadioGroup>
            </FormControl>
            <Stack direction="row" spacing={2} justifyContent="center" alignItems="center">
                <Button variant="text" onClick={() => { props.setActiveStep(0) }}>
                    <ArrowBack/>
                    Back
                </Button>
                <Button variant="contained" onClick={() => { props.setActiveStep(2) }}>
                    Next
                </Button>
            </Stack>
        </>
    )
}

interface NewPassVerificationProps {
    navigate: NavigateFunction;
    setActiveStep: React.Dispatch<React.SetStateAction<number>>;
    name: string;
    value: string;
    setValue: React.Dispatch<React.SetStateAction<string>>;
}

const NewPassVerification = (props: NewPassVerificationProps) => {
    const [code, setCode] = useState('');
    const [verifyInit, setVerifyInit] = useState(false);
    const [timer, setTimer] = useState(45);


    useEffect(() => {
        timer > 0 && verifyInit && setTimeout(() => setTimer(timer - 1), 1000);
    }, [timer, verifyInit]);

    return (
        <>
            <div></div>
            <FormControl fullWidth>
                <TextField
                    fullWidth
                    disabled={verifyInit}
                    label="Phone number"
                    value={props.value}
                    onChange={e => props.setValue(e.target.value)}
                    sx={{mb: 2}}
                />
                <TextField
                    fullWidth
                    label="Code"
                    value={code}
                    onChange={e => e.target.value.length <= 6 && setCode(e.target.value.toUpperCase())}
                    sx={{mb: 2, visibility: verifyInit ? "visible" : "hidden"}}
                />
                <Typography
                    variant="subtitle2"
                    color="rgba(0,0,0,0.5)"
                    sx={{mb: 2, visibility: verifyInit && timer !== 0 ? "visible" : "hidden"}}
                >
                    resend code in <strong>{ timer } seconds</strong>
                </Typography>
                <Button 
                    variant="text" 
                    size="small" 
                    sx={{visibility: verifyInit && timer === 0 ? "visible" : "hidden"}}
                    onClick={async () => {
                    const token = AuthService.getToken();
                    if (token) {
                        try {
                            setTimer(45);
                            await vaultSDK.createPhonePassInit(token, props.value);
                            setVerifyInit(true);
                        } catch(err) {
                            console.error(err)
                        }
                    }
                }}>
                    <Refresh/>
                    Resend code
                </Button>
            </FormControl>
            <Stack display={verifyInit ? "none" : ""} direction="row" spacing={2} justifyContent="center" alignItems="center">
                <Button variant="text" onClick={() => { props.setActiveStep(1) }}>
                    <ArrowBack/>
                    Back
                </Button>
                <Button disabled={props.value.length < 10} variant="contained" onClick={async () => {
                    const token = AuthService.getToken();
                    if (token) {
                        try {
                            await vaultSDK.createPhonePassInit(token, props.value);
                            setVerifyInit(true);
                        } catch(err) {
                            console.error(err)
                        }
                    }
                }}>
                    Next
                </Button>
            </Stack>
            <Stack display={verifyInit ? "" : "none"} direction="row" spacing={2} justifyContent="center" alignItems="center">
                <Button variant="text" onClick={() => { props.navigate('/passes') }}>
                    Cancel
                </Button>
                <Button disabled={code.length !== 6} variant="contained" onClick={async () => {
                    const token = AuthService.getToken();
                    if (token) {
                        try {
                            await vaultSDK.createPhonePassComplete(token, props.name, props.value, code);
                            props.navigate('/passes');
                        } catch(err) {
                            console.error(err)
                        }
                    }
                }}>
                    Finish
                </Button>
            </Stack>
        </>
    )
}

export default function NewPass(){
    const navigate = useNavigate();
    const [activeStep, setActiveStep] = useState(0);
    // const [type, setType] = useState('phone');
    const [name, setName] = useState('');
    const [value, setValue] = useState('');

    const steps = [
        { 
            label: 'Chose a name', 
            component: <NewPassName navigate={navigate} 
                setActiveStep={setActiveStep}
                name={name}
                setName={setName}/> 
        },
        { 
            label: 'Chose a type', 
            component: <NewPassType 
                setActiveStep={setActiveStep}/>
        },
        {
            label: 'Create it',
            component: <NewPassVerification 
                navigate={navigate} 
                setActiveStep={setActiveStep}
                name={name}
                value={value}
                setValue={setValue}/> 
        },
    ];

	useEffect(() => {
	}, []);

	return (
        <VaultBase focus={"passes"}>
            <Paper elevation={0}>
                <Stepper activeStep={activeStep} alternativeLabel sx={{ padding: 2 }}>
                    {
                        steps.map(step => (
                            <Step key={step.label}>
                                <StepLabel>{step.label}</StepLabel>
                            </Step>
                        ))
                    }
                </Stepper>
                <Grid container direction="row" >
                    <Grid item padding={2} xl={4} md={3} xs={0}/>
                    <Grid item 
                        padding={2} 
                        xl={4} md={6} xs={12}
                        sx={{ 
                            minHeight: 400, 
                            display:"flex", 
                            flexWrap:"wrap", 
                            flexDirection:"column", 
                            justifyContent:"space-between", 
                            alignItems: "center" 
                        }}
                    >
                        { steps[activeStep].component }
                    </Grid>
                    <Grid item padding={2} xl={4} md={3} xs={0}/>
                </Grid>
            </Paper>
        </VaultBase>
	);
};
