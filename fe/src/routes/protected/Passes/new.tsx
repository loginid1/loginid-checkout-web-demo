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
import React, { useEffect, useState } from "react";
import { NavigateFunction, useNavigate } from "react-router-dom";
import { VaultBase } from "../../../components/VaultBase";
import { ReactComponent as ProfileDefault } from "../../../assets/sidemenu/DIDs/Default.svg";
import { passesMap, NewPassController } from "./PassController";

interface NewPassNameProps {
    passType: string;
    name: string;
    setName: React.Dispatch<React.SetStateAction<string>>;
    setActiveStep: React.Dispatch<React.SetStateAction<number>>;
}

// Step 1 - Setup the pass name
const NewPassName = (props: NewPassNameProps) => {
    const [sampleName, setSampleName] = useState('')
    
    useEffect(() => {
        const name = "My " + props.passType
            .split("-")
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(" ");
        setSampleName(name);

        if (props.name === "" || props.name === "My Drivers License" || props.name === "My Phone") {
            props.setName(name);
        }
    }, [props])
    
    return (
        <>
            <ProfileDefault width={50} height={50} />
            <Typography
                variant="h2"
                color="secondary"
                sx={{ padding: 2 }}
            >
                Create a new Pass
                <Typography variant="body1" color="gray">
                    Create a name for your new Pass, for example:  ‘{sampleName}’.
                </Typography>
            </Typography>
            <TextField
                fullWidth
                label="Pass name"
                value={props.name}
                onChange={e => props.setName(e.target.value)}
            />
            <Stack direction="row" spacing={2} justifyContent="center" alignItems="center">
                <Button variant="text" onClick={() => { props.setActiveStep(0) }}>
                    <ArrowBack/>
                    Back
                </Button>
                <Button disabled={ props.name.length < 3 } variant="contained" onClick={() => { props.setActiveStep(2) }}>
                    Next
                </Button>
            </Stack>
        </>
    )
}

// Step 2 - Select the pass type
interface NewPassTypeProps {
    navigate: NavigateFunction;
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
            <ProfileDefault width={50} height={50} />
            <Typography
                variant="h2"
                color="secondary"
                sx={{ padding: 2 }}
            >
                Create a new Pass
                <Typography variant="body1" color="gray">
                    Select the type of Pass you would like to create. Passes, and this information, can be selectively shared by you with other parties in the future.
                </Typography>
            </Typography>
            <FormControl sx={{ paddingBottom: 4 }}>
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
                <Button variant="text" onClick={() => { props.navigate('/passes') }}>
                    <ArrowBack/>
                    Back
                </Button>
                <Button variant="contained" onClick={() => { props.setActiveStep(1) }}>
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
            label: 'Chose a type', 
            component: <NewPassType {...{navigate, setActiveStep, passType: type, setPassType: setType}}/>
        },
        { 
            label: 'Chose a name', 
            component: <NewPassName {...{setActiveStep, name, setName, passType: type}}/> 
        },
        {
            label: 'Create it',
            component: <NewPassController {...{navigate, setActiveStep, name, passType: type}}/> 
        },
    ];

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
                    <Grid item padding={2} lg={3} xs={0}/>
                    <Grid item 
                        padding={2} 
                        lg={6} xs={12}
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
                    <Grid item padding={2} lg={3} xs={0}/>
                </Grid>
            </Paper>
        </VaultBase>
	);
};
