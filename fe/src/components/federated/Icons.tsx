import { AlertColor } from "@mui/material";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import AccountIcon from "@mui/icons-material/AccountCircle";

export function PassIcon(props: { type: string, color?: AlertColor }) {
	if (props.type === "email") {
		return <EmailIcon fontSize="small" color={props.color || "primary"} sx={{ml:1}}/>;
	} else if (props.type === "phone") {
		return <PhoneIcon fontSize="small" color={props.color || "primary"} sx={{ml:1}} />;
	} else {
		return <AccountIcon fontSize="small" color={props.color || "primary"} sx={{ml:1}} />;
	}
}