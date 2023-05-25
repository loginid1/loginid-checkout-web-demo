import { NavigateFunction } from "react-router-dom";
import { Typography } from "@mui/material";
import PhonePass from "./PhonePass";
import DriversLicensePass from "./DriversLicensePass";
import { ReactComponent as ProfileDefault } from "../../../assets/sidemenu/DIDs/Default.svg";

interface PassController {
    label: string;
    isEnabled: boolean;
    controller: (props: NewPassControllerProps) => (JSX.Element);
}

const passesMap: { [id: string]: PassController } = {
    "email": {
        label: "Email",
        isEnabled: false,
        controller: (props: NewPassControllerProps) => <></>,
    },
    "phone": {
        label: "Phone Number",
        isEnabled: true,
        controller: (props: NewPassControllerProps) => <PhonePass {...props}/>,
    },
    "drivers-license": {
        label: "Drivers License",
        isEnabled: true,
        controller: (props: NewPassControllerProps) => <DriversLicensePass {...props}/>,
    }
}

interface NewPassControllerProps {
    navigate: NavigateFunction;
    setActiveStep: React.Dispatch<React.SetStateAction<number>>;
    name: string;
    passType: string;
}

const NewPassController = (props: NewPassControllerProps) => {
    const pass = passesMap[props.passType];
    return (
        <>
            <ProfileDefault width={50} height={50} />
            <Typography
                variant="h2"
                color="secondary"
                sx={{ padding: 2 }}
            >
                Create a new Pass
            </Typography>
            { pass.controller(props) }
        </>
    )
}

export { NewPassController, passesMap };    
export type { NewPassControllerProps };
