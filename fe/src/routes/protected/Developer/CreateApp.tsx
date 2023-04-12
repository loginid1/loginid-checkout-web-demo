import { Add, CheckBox, ContentCopy } from "@mui/icons-material";
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
import { DisplayAppList } from "../../../components/AppList";
import { VaultBase } from "../../../components/VaultBase";
import { DisplayMessage } from "../../../lib/common/message";
import { ArrayUtil } from "../../../lib/util/array";
import ParseUtil from "../../../lib/util/parse";
import vaultSDK from "../../../lib/VaultSDK";
import { AppList } from "../../../lib/VaultSDK/vault/developer";
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
	const [disable, setDisable] = useState<boolean>(false);
	const [api, setApi] = useState<string>("");

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
				const response = await vaultSDK.createApp(token, {
					app_name: name,
					origins: origins,
					attributes: attributeList.join(),
					id: "",
					uat: "",
				});

				// disable create button
				setApi(response.id);
				setDisplayMessage({
					type: "info",
					text: "created successful!",
				});
				setDisable(true);
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
					<Grid container item xs={12}>
						<Typography variant="h2" color="secondary" align="left">
							Create Application
						</Typography>
					</Grid>
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
					{disable && (
						<Grid container item xs={12}>
							<TextField
								fullWidth
								label="API"
								value={api}
								size="small"
								disabled
							/>
						</Grid>
					)}
					<Grid container item xs={12}>
						<TextField
							fullWidth
							label="App Name"
							value={name}
							size="small"
							focused
							onChange={(e) => setName(e.target.value)}
						/>
					</Grid>
					<Grid container item xs={12}>
						<TextField
							fullWidth
							label="Origin"
							value={origins}
							size="small"
							helperText="domain name i.e. example.com"
							onChange={(e) => setOrigins(e.target.value)}
						/>
					</Grid>
					<Grid item xs={12}>
						<Divider variant="fullWidth"></Divider>
					</Grid>

					<Grid item xs={12}>
						<FormControl
							sx={{ m: 1 }}
							component="fieldset"
							variant="standard"
							fullWidth
						>
							<FormLabel component="legend">
								Identification Requirements
							</FormLabel>
							<FormGroup>
								<FormControlLabel
									control={
										<Checkbox
											checked={email}
											onChange={(e) =>
												handleAttributeChange(
													"email",
													e.target.checked
												)
											}
											name="email"
										/>
									}
									label="Email Verification"
								/>
								<FormControlLabel
									control={
										<Checkbox
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
									label="Phone Verification"
								/>
							</FormGroup>
							<FormHelperText>
								Attribute will required user to consent
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
							disabled={disable}
						>
							Create
						</Button>
					</Grid>
				</Grid>
			</Paper>
		</VaultBase>
	);
}
