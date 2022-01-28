import React, { useEffect, useState } from "react";

import { useNavigate } from "react-router-dom";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import {
	AppBar,
	Avatar,
	Box,
	Breadcrumbs,
	Button,
	Checkbox,
	Container,
	CssBaseline,
	Dialog,
	DialogActions,
	DialogContent,
	DialogContentText,
	DialogTitle,
	FormControlLabel,
	Grid,
	IconButton,
	Link,
	Paper,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	TextField,
	Toolbar,
	Typography,
} from "@mui/material";
import { Home, Menu } from "@mui/icons-material";
//import MenuIcon from '@mui/icons-material/Menu';
import vaultSDK from "../../lib/VaultSDK";
import { AuthService } from "../../services/auth";
import { Credentials, Profile } from "../../lib/VaultSDK/vault/user";

const theme = createTheme();

function ManageCredential() {
	const navigate = useNavigate();

	const [profile, setProfile] = useState<Profile | null>(null);
	const [credentials, setCredentials] = useState<Credentials | null>(null);
	const [username, setUsername] = useState(AuthService.getUsername());
	const [errorMessage, setErrorMessage] = useState("");
	useEffect(() => {
		retrieveProfile();
		retrieveCredentials();
	}, []);

	async function retrieveProfile() {
		const token = AuthService.getToken();
		if (token) {
			const myProfile = await vaultSDK.getProfile(token);
			setProfile(myProfile);
		} else {
		}
	}

	async function retrieveCredentials() {
		const token = AuthService.getToken();
		if (token) {
			const myCredentials = await vaultSDK.getCredentials(token);
			console.log(myCredentials);
			setCredentials(myCredentials);
		} else {
		}
	}

    const [open, setOpen] = React.useState(false);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

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
                            onClick={()=>navigate("/home")}
						>
							<Home />
						</IconButton>
						<Typography
							variant="h6"
							color="inherit"
							component="div"
						>
							Manage Credential
						</Typography>
					</Toolbar>
				</AppBar>
				<TableContainer component={Paper} sx={{mt:2}}>
					<Table size="small" aria-label="a dense table">
						<TableHead>
							<TableRow>
								<TableCell colSpan={3}>
									My Credentials
								</TableCell>
							</TableRow>
						</TableHead>
						<TableHead>
							<TableRow>
								<TableCell>Name</TableCell>
								<TableCell align="right">Algorithm</TableCell>
								<TableCell align="right">Time</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{credentials?.credentials.map((credential) => (
								<TableRow
									key={credential.id}
									sx={{
										"&:last-child td, &:last-child th": {
											border: 0,
										},
									}}
								>
									<TableCell component="th" scope="row">
										{credential.name}
									</TableCell>
									<TableCell align="right">
										{credential.key_alg}
									</TableCell>
									<TableCell align="right">
										{credential.iat}
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</TableContainer>
				<Button onClick={handleClickOpen}>Device Registration Code</Button>

                <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {"Registration Code: XXXYYY"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            You have 5 minutes to use this code to register for new device
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Close</Button>
        </DialogActions>
      </Dialog>

			</Container>
		</ThemeProvider>
	);
}

export default ManageCredential;
