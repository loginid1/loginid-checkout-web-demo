import { ContentCopy } from "@mui/icons-material";
import {
	Box,
	Button,
	Chip,
	Dialog,
	DialogActions,
	DialogContent,
	DialogProps,
	Stack,
	Typography,
} from "@mui/material";
import { useState } from "react";
import ParseUtil from "../../lib/util/parse";
import { KeyDisplay } from "../KeyDisplay";
import EmailIcon from "@mui/icons-material/Email";

interface EmailProps extends DialogProps {
	email: string;
	session: string;
	type: string;
	handleClose: () => void;
}

export function EmailDialog(props: EmailProps) {
	function handleClose() {
		props.handleClose();
	}

	return (
		<Dialog open={props.open} fullWidth>
			{props.type === "register" ? (
				<Register></Register>
			) : (
				<Login></Login>
			)}
		</Dialog>
	);

	function Register() {
		return (
			<>
				<DialogContent>
					<Typography variant="h6" color="primary" sx={{ mb: 2 }}>
						Check email to register
					</Typography>
					<Typography variant="body2">
						<p>
							Please follow the instruction sent to{" "}
							<b>{props.email}</b>, and click on the confirm email
							button. The code below should also be in the
							confirmation email received.
						</p>
					</Typography>
					<Typography
						align="center"
						variant="h2"
						color="secondary"
						sx={{ m: 2 }}
					>
						{ParseUtil.displaySessionSF(props.session)}
					</Typography>
				</DialogContent>
				<DialogActions>
					<Button variant="text" onClick={() => handleClose()}>
						cancel
					</Button>
				</DialogActions>
			</>
		);
	}
	function Login() {
		return (
			<>
				<DialogContent>
					<Typography variant="h6" color="primary" sx={{ mb: 2 }}>
						Check email to login
					</Typography>
					<Typography variant="body2">
						<p>
							Please follow the instruction sent to{" "}
							<b>{props.email}</b>, and click on the confirm email
							button. The code below should also be in the
							confirmation email received.
						</p>
					</Typography>
					<Typography
						align="center"
						variant="h2"
						color="secondary"
						sx={{ m: 2 }}
					>
						{ParseUtil.displaySessionSF(props.session)}
					</Typography>
				</DialogContent>
				<DialogActions>
					<Button variant="text" onClick={() => handleClose()}>
						cancel
					</Button>
				</DialogActions>
			</>
		);
	}
}
