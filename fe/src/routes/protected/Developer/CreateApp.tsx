import {
	Grid,
	Typography,
	Button,
	Paper,
	TextField,
	Divider,
	Checkbox,
	FormControl,
	FormControlLabel,
	FormGroup,
	FormHelperText,
	FormLabel,
	Alert,
	AlertColor,
} from "@mui/material";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { VaultBase } from "../../../components/VaultBase";
import { DisplayMessage } from "../../../lib/common/message";
import vaultSDK from "../../../lib/VaultSDK";
import { AuthService } from "../../../services/auth";

export default function CreateApp() {
	const navigate = useNavigate();
	const [name, setName] = useState("");
	const [origins, setOrigins] = useState("");
	const [displayMessage, setDisplayMessage] = useState<DisplayMessage | null>(
		null
	);
	const [attributeList, setAttributeList] = useState<string[]>(["email"]);
	const [email, setEmail] = useState<boolean>(true);
	const [phone, setPhone] = useState<boolean>(false);

	useEffect(() => {}, []);

	async function handleCreateApp() {
		const token = AuthService.getToken();
		if (token) {
			// validate fields
			if (name.length === 0) {
				setDisplayMessage({ type: "error", text: "name is required" });
				return;
			}
			if (origins.length === 0) {
				setDisplayMessage({
					type: "error",
					text: "origin is required",
				});
				return;
			}

			try {
				const result = await vaultSDK.createApp(token, {
					app_name: name,
					origins: origins,
					attributes: attributeList.join(),
					id: "",
					uat: "",
				});

				navigate(`/developer/app/${result.id}`);
			} catch (error) {
				setDisplayMessage({
					type: "error",
					text: (error as Error).message,
				});
			}
		} else {
			// navigate to login
		}
	}
	function handleAttributeChange(key: string, isChecked: boolean) {
		let oldList = attributeList;
		if (isChecked) {
			oldList.push(key);
			setAttributeList(oldList);
		} else {
			//setFormCredIDList(formCredIDList.filter((item) => item !== id));
			oldList = oldList.filter((item) => item !== key);
			setAttributeList(oldList);
		}

		if (key === "email") {
			setEmail(isChecked);
		}
		if (key === "phone") {
			setPhone(isChecked);
		}
	}

	return (
		<VaultBase focus={"developer"}>
			<Typography
				variant="h2"
				color="secondary"
				align="left"
				sx={{
					padding: { md: 4, xs: 2 },
				}}
			>
				Create Application
			</Typography>
			<Paper
				elevation={0}
				sx={{
					p: { md: 4, xs: 2 },
					mb: 2,
					display: "flex",
					justifyContent: "center",
				}}
			>
				<Grid container spacing={{ md: 2, xs: 1 }} alignItems="center">
					{displayMessage && (
						<Grid container item xs={12}>
							<Alert
								severity={
									(displayMessage?.type as AlertColor) ||
									"info"
								}
							>
								{displayMessage.text}
							</Alert>
						</Grid>
					)}
					<Grid container item xs={12}>
						<TextField
							fullWidth
							label="Application Name"
							value={name}
							size="small"
							onChange={(e) => setName(e.target.value)}
						/>
					</Grid>
					<Grid container item xs={12}>
						<TextField
							fullWidth
							label="Origin"
							value={origins}
							size="small"
							helperText="domain name i.e. https://example.com , http://localhost:3000"
							onChange={(e) => setOrigins(e.target.value)}
						/>
					</Grid>
					<Grid item xs={12}>
						<Divider variant="fullWidth"></Divider>
					</Grid>

					<Grid item xs={12}>
						<FormControl
							sx={{ m: 1, textAlign: "left" }}
							component="fieldset"
							variant="standard"
							fullWidth
						>
							<FormLabel component="legend">
								<strong>User Identifiers</strong>
							</FormLabel>
							<FormGroup>
								<FormControlLabel
									control={
										<Checkbox
											readOnly
											disabled
											checked={email}
											// onChange={(e) =>
											// 	handleAttributeChange(
											// 		"email",
											// 		e.target.checked
											// 	)
											// }
											name="email"
										/>
									}
									label="Email Verification"
								/>
								<FormControlLabel
									control={
										<Checkbox
											disabled
											checked={phone}
											onChange={(e) =>
												handleAttributeChange(
													"phone",
													e.target.checked
												)
											}
											name="phone"
										/>
									}
									label="Phone Verification (contact support@loginid.io)"
								/>

							</FormGroup>
							<FormHelperText>
								Choose how users will identify themselves on your app or site. If an option is chosen, our wallet will then require users to verify these options prior in order for their account to be created. We are continuously adding more identifiers with each release.
							</FormHelperText>
						</FormControl>
					</Grid>
					<Grid item xs={12}>
						<Button
							variant="text"
							size="large"
							sx={{ mr: 2 }}
							onClick={() => navigate("/developer/console")}
						>
							Cancel
						</Button>
						<Button
							variant="contained"
							size="large"
							onClick={handleCreateApp}
						>
							Create
						</Button>
					</Grid>
				</Grid>
			</Paper>
		</VaultBase>
	);
}
