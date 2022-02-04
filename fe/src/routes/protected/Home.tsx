import React, { useEffect, useState } from "react";

import { useNavigate } from "react-router-dom";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import {
	AppBar,
	Avatar,
	Box,
	Button,
	Card,
	CardActions,
	CardContent,
	CardMedia,
	Checkbox,
	Container,
	CssBaseline,
	FormControlLabel,
	Grid,
	IconButton,
	Link,
	TextField,
	Toolbar,
	Typography,
} from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import vaultSDK from "../../lib/VaultSDK";
import { AuthService } from "../../services/auth";
import { Profile } from "../../lib/VaultSDK/vault/user";
import MenuIcon from "@mui/icons-material/Menu";

const theme = createTheme();

function Home() {
	const navigate = useNavigate();

	const [profile, setProfile] = useState<Profile | null>(null);
	const [username, setUsername] = useState(AuthService.getUsername());
	const [errorMessage, setErrorMessage] = useState("");

	useEffect(() => {
		retrieveProfile();
	}, []);

	async function retrieveProfile() {
		const token = AuthService.getToken();
		if (token) {
			const myProfile = await vaultSDK.getProfile(token);
			setProfile(myProfile);
		} else {
			// redirect to login
			navigate(
				"/login?redirect_error=" +
					encodeURIComponent("not authorized - please login again")
			);
		}
	}

	//retrieveProfile();

	function handleLogout(e: React.MouseEvent) {
		AuthService.logout();
		navigate("/login");
	}

	return (
		<ThemeProvider theme={theme}>
			<Container component="main" maxWidth="xs">
				<AppBar position="static">
					<Toolbar variant="dense">
						<IconButton
							edge="start"
							color="inherit"
							aria-label="menu"
							sx={{ mr: 2 }}
						>
							<MenuIcon />
						</IconButton>
						<Typography
							variant="h6"
							color="inherit"
							component="div"
						>
							Welcome {username}
						</Typography>
					</Toolbar>
				</AppBar>
				<CssBaseline />
				<Box sx={{ mt: 1 }}>
					<Card sx={{ m: 2, maxWidth: 345 }}>
						<CardContent>
							<Typography
								gutterBottom
								variant="h5"
								component="div"
								align="left"
							>
								My Device Credentials
							</Typography>
							<Typography
								variant="body1"
								color="text.secondary"
								align="left"
							>
								Adding multiple credentials allows you to
								securely access your account from multiple
								devices and to improve your account recovery.
							</Typography>
							<Typography
								sx={{ m: 2 }}
								variant="body2"
								color="text.secondary"
								align="left"
							>
								You currently have {profile?.num_credential}{" "}
								credentials <br />
								You currently have {profile?.num_recovery}{" "}
								recovery code
							</Typography>
						</CardContent>
						<CardActions>
							<Button
								size="small"
								onClick={() => navigate("/manage_credential")}
							>
								Manage
							</Button>
						</CardActions>
					</Card>

					<Card sx={{ m: 2, maxWidth: 345 }}>
						<CardContent>
							<Typography
								gutterBottom
								variant="h5"
								component="div"
								align="left"
							>
								My Algorand Account
							</Typography>
							<Typography
								variant="body1"
								color="text.secondary"
								align="left"
							>
								Setup your Algorand account using your device
								credentials and recovery options.
							</Typography>
							<Typography
								sx={{ m: 2 }}
								variant="body2"
								color="text.secondary"
								align="left"
							>
								You currently have {profile?.num_algorand}{" "}
								accounts <br />
							</Typography>
						</CardContent>
						<CardActions>
							<Button size="small" onClick={() => navigate("/manage_algorand")}>Manage</Button>
							<Button size="small">Learn More</Button>
						</CardActions>
					</Card>
					<Card sx={{ m: 2, maxWidth: 345 }}>
						<CardContent>
							<Typography
								gutterBottom
								variant="h5"
								component="div"
								align="left"
							>
								Recent Activity
							</Typography>
							<Typography
								sx={{ m: 2 }}
								variant="body2"
								color="text.secondary"
								align="left"
							>
								{profile?.recent_activity}
							</Typography>
						</CardContent>
						<CardActions>
							<Button size="small">Manage</Button>
							<Button size="small">Learn More</Button>
						</CardActions>
					</Card>

					<Typography variant="body1">
						<Link href="#" onClick={handleLogout}>
							Logout
						</Link>
					</Typography>
				</Box>
			</Container>
		</ThemeProvider>
	);
}

export default Home;
