import { Alert, AlertColor, Typography, TextField, Button, Stack, CircularProgress, Link } from "@mui/material";
import { useState } from "react";
import { DisplayMessage } from "../../lib/common/message";
import { CodeInput } from "../CodeInput";

export function Login(props:{session: string, origin: string, handleLogin: ()=> void}){
  
	const [displayMessage, setDisplayMessage] = useState<DisplayMessage | null>( null);
	const [showRegister, setShowRegister] = useState<boolean>(false);
	const [waitingMessage, setWaitingMessage] = useState<string | null>(null);
    const [username, setUsername] = useState<string>("");
    function handleLogin(){

    }

    function handleSignup(){
        
    }

    return (

			<>
				{displayMessage && (
					<Alert
						severity={
							(displayMessage?.type as AlertColor) || "info"
						}
						sx={{ mt: 2 }}
					>
						{displayMessage.text}
					</Alert>
				)}
				<Typography
					sx={{ m: 1 }}
					variant="body2"
					color="text.secondary"
				>
					Sign In or Sign Up
				</Typography>
				<TextField
					fullWidth
					label="Email"
					value={username}
					size="small"
					onChange={(e) => setUsername(e.target.value)}
					focused
				/>

				<Button
					fullWidth
					variant="contained"
					onClick={handleLogin}
					size="small"
					sx={{ mt: 1, mb: 1 }}
				>
					Continue
				</Button>
				{showRegister &&
				<Button
					fullWidth
					variant="text"
					onClick={handleSignup}
					size="small"
					sx={{ mt: 1, mb: 1 }}
				>
					Signup
				</Button>
				}
				<Link
					href="/faq"
					sx={{ m: 1 }}
					variant="caption"
					color="text.secondary"
				>
					Learn more
				</Link>
				{waitingMessage && (
					<Stack direction="row" alignItems="center">
						<CircularProgress size="2rem" />
						<Typography variant="caption">
							{waitingMessage}
						</Typography>
					</Stack>
				)}
			</>

    );
}