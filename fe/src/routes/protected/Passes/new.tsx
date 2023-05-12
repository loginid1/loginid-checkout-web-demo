import { ArrowBack } from "@mui/icons-material";
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
import { passesMap, NewPassController } from "./PassController";

interface NewPassNameProps {
    navigate: NavigateFunction;
    setActiveStep: React.Dispatch<React.SetStateAction<number>>;
    name: string;
    setName: React.Dispatch<React.SetStateAction<string>>;
}

// Step 1 - Setup the pass name
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

// Step 2 - Select the pass type
interface NewPassTypeProps {
    setActiveStep: React.Dispatch<React.SetStateAction<number>>;
    passType: string;
    setPassType: React.Dispatch<React.SetStateAction<string>>;
}

const NewPassType = (props: NewPassTypeProps) => {
    const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        props.setPassType(event.currentTarget.value);
    }
    
    return (
        <>
            <div></div>
            <FormControl>
                <FormLabel id="pass-selector">Type</FormLabel>
                <RadioGroup
                    row
                    aria-labelledby="pass-selector"
                    name="pass"
                    value={props.passType}
                    onChange={onChange}
                >
                    {
                        Object.keys(passesMap).map((key: string) => {
                            const pass = passesMap[key];

                            return <FormControlLabel 
                                disabled={!pass.isEnabled}
                                key={key}
                                value={key}
                                label={pass.label}
                                control={<Radio />} />
                        })
                    }
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

// Step 3 - Generate the pass based on specific pass requirements
export default function NewPass(){
    const navigate = useNavigate();
    const [activeStep, setActiveStep] = useState(0);
    const [type, setType] = useState('phone');
    const [name, setName] = useState('');

    const steps = [
        { 
            label: 'Chose a name', 
            component: <NewPassName 
                navigate={navigate} 
                setActiveStep={setActiveStep}
                name={name}
                setName={setName}/> 
        },
        { 
            label: 'Chose a type', 
            component: <NewPassType 
                setActiveStep={setActiveStep}
                passType={type}
                setPassType={setType}/>
        },
        {
            label: 'Create it',
            component: <NewPassController 
                navigate={navigate} 
                setActiveStep={setActiveStep}
                name={name}
                passType={type}/> 
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
