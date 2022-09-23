import { ContentCopy } from "@mui/icons-material";
import {
	Box,
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogProps,
	Stack,
	Typography,
} from "@mui/material";
import { useState } from "react";
import { KeyDisplay } from "../KeyDisplay";

interface GetStartedProps extends DialogProps {
	address: string;
	handleClose: () => void;
}

export function GetStartedDialog(props: GetStartedProps) {
	const [step, setStep] = useState<number>(0);
	function handleClose() {
		props.handleClose();
	}

	function handlePrevious() {
		setStep(step - 1);
	}
	function handleNext() {
		setStep(step + 1);
	}

	function copy(text: string) {
		navigator.clipboard.writeText(text);
	}
	return (
		<Dialog open={props.open} maxWidth="xs" fullWidth>
			<DisplayContent />
		</Dialog>
	);

	function DisplayContent() {
		switch (step) {
			case 1:
				return <DisplayFirst />;
			case 2:
				return <DisplaySecond />;
			case 3:
				return <DisplayThird />;
			default:
				return <DisplayIntro></DisplayIntro>;
		}
	}

	function DisplayIntro() {
		return (
			<>
				<DialogContent>
					<Typography align="center" variant="h2" color="secondary">
						Algorand Account Created!
					</Typography>
					<Typography align="center" variant="body1" sx={{ p: 2 }}>
						Congratulations! You have successfully created a new
						Algorand account. Press <b>Learn More</b> to get started
						with a short walkthrough of your Algorand account.
					</Typography>
					<Stack spacing={2} alignItems="center">
						<Typography variant="h3">
							Your Account Address
						</Typography>
						<KeyDisplay color="error" value={props.address} />
					</Stack>
				</DialogContent>
				<DialogActions sx={{ justifyContent: "center", mb: 2 }}>
					<Button variant="text" onClick={() => handleClose()}>
						Skip
					</Button>

					<Button variant="contained" onClick={() => handleNext()}>
						Learn More
					</Button>
				</DialogActions>
			</>
		);
	}
	function DisplayFirst() {
		return (
			<>
				<DialogContent>
					<Typography align="center" variant="h2" color="secondary">
						Your Address Information!
					</Typography>
					<Typography align="center" variant="body1" sx={{ p: 2 }}>
						An Algorand address is the identifier for an Algorand
						account that hold specific onchain data, like your Algo
						balance and assets.
					</Typography>
					<Box
						component="img"
						alignItems="center"
						src="/help/tut1-address.png"
						sx={{ width: "90%" }}
					/>
					<Typography align="left" variant="body1" sx={{ p: 2 }}>
						1. When sharing your address with other user and Dapps.
						Use the <ContentCopy fontSize="small" /> icon to copy
						the full address. The address is 58 characters long.
					</Typography>
				</DialogContent>
				<DialogActions sx={{ justifyContent: "center", mb: 2 }}>

					<Button variant="contained" onClick={() => handleNext()}>
						Next
					</Button>
				</DialogActions>
			</>
		);
	}
	function DisplaySecond() {
		return (
			<>
				<DialogContent>
					<Typography align="center" variant="h2" color="secondary">
						About signing credentials!
					</Typography>
					<Typography align="center" variant="body1" sx={{ p: 2 }}>
						Your Algorand account is secured by <b>FIDO</b>{" "}
						biometric authenticaton from your device. You can setup
						multiple FIDO credentials for convenience and recovery.
						It is the safest way to secure your account.
					</Typography>
					<Box
						component="img"
						alignItems="center"
						src="/help/tut2-credentials.png"
						sx={{ width: "90%" }}
					/>
					<Typography align="left" variant="body1" sx={{ p: 2 }}>
						2. Indicated which credential(s) can authorized this
						algorand account. You can go to "Manage Credential" and
						register additional devices at any time. Afterward, you
						can update your Algorand account to use any of the
						registered devices.
					</Typography>
				</DialogContent>
				<DialogActions sx={{ justifyContent: "center", mb: 2 }}>
					<Button variant="text" onClick={() => handlePrevious()}>
                Back
					</Button>

					<Button variant="contained" onClick={() => handleNext()}>
						Next
					</Button>
				</DialogActions>
			</>
		);
	}

	function DisplayThird() {
		return (
			<>
				<DialogContent>
					<Typography align="center" variant="h2" color="secondary">
						Funding your account with ALGOs!
					</Typography>
					<Typography align="center" variant="body1" sx={{ p: 2 }}>
						ALGO is a the standard currency for Algorand network.
						Account requires a minimum amount of ALGOs to perform
						any transactions and hold assets. Signing transactions with ALGO is cheap thanks
						to Algorand fast and scalable design.
					</Typography>
					<Box
						component="img"
						alignItems="center"
						src="/help/tut3-buy-algo.png"
						sx={{ width: "90%" }}
					/>
					<Typography align="left" variant="body1" sx={{ p: 2 }}>
						3. Indicated your current Algos balance which is "not
						available" for starting account. You can buy Algos from
						your credit/debit card with "SendWyre" to activate it.
						You can also fund your algo from other's account by
						request payment transaction to your account address.
					</Typography>
				</DialogContent>
				<DialogActions sx={{ justifyContent: "center", mb: 2 }}>
					<Button variant="text" onClick={() => handlePrevious()}>
						Back
					</Button>

					<Button variant="contained" onClick={() => handleClose()}>
                        Complete
					</Button>
				</DialogActions>
			</>
		);
	}
}
