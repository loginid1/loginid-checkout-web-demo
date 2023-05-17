import { MoreVert, Add, Share, Delete } from "@mui/icons-material";
import {
	Stack,
	Button,
	Grid,
	Typography,
	IconButton,
	Card,
	CardHeader,
	CardContent,
	CardActions,
	CircularProgress,
	Menu,
	MenuItem,
	ListItemIcon,
	ListItemText,
} from "@mui/material";
import { useState, useEffect } from "react";
import Moment from "moment";
import vaultSDK from "../../../lib/VaultSDK";
import { EmailPass, PhonePass, DriversLicensePass, Pass } from "../../../lib/VaultSDK/vault/pass";
import { AuthService } from "../../../services/auth";
import { NavigateFunction, useNavigate } from "react-router-dom";
import { VaultBase } from "../../../components/VaultBase";
import NewPass from "./new";
import moment from "moment";
import { Consent } from "../../../lib/VaultSDK/vault/user";
import { DisplayConsents } from "../../../components/AppConsentList";

interface PassDataProps {
	pass: Pass;
}

const PassData = (props: PassDataProps): JSX.Element => {
	switch (props.pass.schema) {
		case "email":
			const emailData = props.pass.data as EmailPass
			return (
				<Typography variant="body1">
					{emailData.email}
				</Typography>
			);
		case "phone":
			const phoneData = props.pass.data as PhonePass
			return (
				<Typography variant="body1">
					{phoneData.phone_number}
				</Typography>
			);
		case "drivers-license":
			const dlData = props.pass.data as DriversLicensePass
			return (
				<>
					<Typography display={dlData.full_name === undefined ? "none" : ""} textAlign="left" variant="body1">
						<strong>Name: </strong> {dlData.full_name}
					</Typography>
					<Typography display={dlData.personal_id_number === undefined ? "none" : ""} textAlign="left" variant="body1">
						<strong>ID Number: </strong> {dlData.personal_id_number}
					</Typography>
					<Typography textAlign="left" variant="body1">
						<strong>Document Number: </strong> {dlData.document_number}
					</Typography>
					<Typography display={dlData.document_country === undefined ? "none" : ""} textAlign="left" variant="body1">
						<strong>Country: </strong> {dlData.document_country}
					</Typography>
					<Typography display={dlData.address === undefined ? "none" : ""} textAlign="left" variant="body1">
						<strong>Address: </strong> {dlData.address}
					</Typography>
					<Typography display={dlData.date_of_birth === undefined ? "none" : ""} textAlign="left" variant="body1">
						<strong>Date of Birth: </strong> {moment(dlData.date_of_birth).format("DD/MM/YYYY")}
					</Typography>
					<Typography display={dlData.date_of_issue === undefined ? "none" : ""} textAlign="left" variant="body1">
						<strong>Issuing Date: </strong> {moment(dlData.date_of_issue).format("DD/MM/YYYY")}
					</Typography>
					<Typography display={dlData.date_of_expiry === undefined ? "none" : ""} textAlign="left" variant="body1">
						<strong>Expiry Date: </strong> {moment(dlData.date_of_expiry).format("DD/MM/YYYY")}
					</Typography>
				</>
			);
		default:
			return (<></>);
	}
}

const PassMenu = (props: {passId: string; }) => {
	const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
	const open = Boolean(anchorEl);

	const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
		setAnchorEl(event.currentTarget);
	};
	const handleClose = () => {
		setAnchorEl(null);
	};
	const handleDelete = async() => {
		setAnchorEl(null);
		const token = AuthService.getToken();
		if (token) {
			try {
				await vaultSDK.deletePass(token, props.passId);
				window.location.reload();
			} catch (err) {
				console.error(err);
			}
		}
	};

	return (
		<>
			<IconButton
				id={`pass-settings-${props.passId}`}
				aria-controls={open ? `pass-menu-${props.passId}` : undefined}
				aria-haspopup="true"
				aria-expanded={open ? 'true' : undefined}
				onClick={handleClick}
				aria-label="settings">
				<MoreVert />
			</IconButton>
			<Menu
				id={`pass-menu-${props.passId}`}
				anchorEl={anchorEl}
				open={open}
				onClose={handleClose}
				MenuListProps={{
					'aria-labelledby': `pass-settings-${props.passId}`
				}}
				anchorOrigin={{
					vertical: 'bottom',
					horizontal: 'right',
				}}
				transformOrigin={{
					vertical: 'top',
					horizontal: 'right',
				}}
			>
				<MenuItem onClick={handleDelete}>
					<ListItemIcon>
						<Delete fontSize="small" />
					</ListItemIcon>
					<ListItemText>Delete</ListItemText>
				</MenuItem>
			</Menu>
		</>
	)
}

const Passes = () => {
	const navigate = useNavigate();
	const [passes, setPasses] = useState<Pass[] | null>(null);
	const [consents, setConsents] = useState<Consent[]>([]);
	
	useEffect(() => {
		const fetchData = async () => {
			const token = AuthService.getToken();
			if (token) {
				const result = await vaultSDK.getPasses(token);
				setPasses(result);
			}
		}

		fetchData();
	}, []);

	return (
		<VaultBase focus={"passes"}>
			<Typography
				variant="h2"
				color="secondary"
				align="left"
				sx={{
					padding: { md: 4, xs: 2 },
				}}
			>
				Your Passes
			</Typography>
			{ passes === null ? 
				(
					<Stack direction="row" justifyContent="center">
						<CircularProgress />
					</Stack>
				) : (
					passes.length === 0 ? 
					(
						<>
							<Typography align="center" fontSize={30} fontWeight="bold" color="rgba(0,0,0,0.5)" sx={{pb: 5, pt: 10}}>
								You don't have any passes yet
							</Typography>
							<Stack direction="row" justifyContent="center" spacing={2}>
								<Button variant="text" onClick={() => {navigate('/passes/new')}}>
									<Add/>
									Add your first pass
								</Button>
							</Stack>
						</>
					) : (
						<>
							<Grid container direction="row" >
								{ passes.map(pass => (
									<Grid item padding={2} xl={4} lg={4} md={6} xs={12}>
										<Card sx={{ minHeight: 350, display:"flex", flexWrap:"wrap", flexDirection:"column", justifyContent:"space-between" }}>
											<CardHeader
												action={
													<PassMenu passId={pass.id}/>
												}
												title={
													<Typography align="left" fontSize={20} lineHeight={1.5} fontWeight="bold" textTransform="uppercase">
														{pass.name}
													</Typography>
												}
												subheader={
													<Typography align="left" fontSize={14} color="rgba(0,0,0,0.5)">
														Added {Moment(pass.created_at).format("DD/MM/YYYY hh:mm A")}
													</Typography>
												}
											/>
											<CardContent>
												<PassData pass={pass}/>
											</CardContent>
											<CardActions disableSpacing>
												<IconButton aria-label="share">
													<Share />
												</IconButton>
											</CardActions>
										</Card>
									</Grid>
								))}
							</Grid>
							<Stack direction="row" spacing={2}>
								<Button variant="text" onClick={() => {navigate('/passes/new')}}>
									<Add/>
									Add a new pass
								</Button>
							</Stack>
								
						</>
					)
				)
			}
		</VaultBase>
	);
};

export { Passes, NewPass };
export default Passes;
