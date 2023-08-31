import { MoreVert, Add, Share, Delete, History } from "@mui/icons-material";
import {
	Avatar,
	AvatarGroup,
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
	Tooltip,
} from "@mui/material";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Moment from "moment";
import vaultSDK from "../../../lib/VaultSDK";
import { Pass } from "../../../lib/VaultSDK/vault/pass";
import { AuthService } from "../../../services/auth";
import { VaultBase } from "../../../components/VaultBase";
import NewPass from "./new";
import { Consent } from "../../../lib/VaultSDK/vault/user";

const DISABLE_NEW_PASS = process.env.REACT_APP_DISABLE_NEW_PASS || "false";

function stringToColor(string: string) {
	let hash = 0;
	let i;

	/* eslint-disable no-bitwise */
	for (i = 0; i < string.length; i += 1) {
		hash = string.charCodeAt(i) + ((hash << 5) - hash);
	}

	let color = '#';

	for (i = 0; i < 3; i += 1) {
		const value = (hash >> (i * 8)) & 0xff;
		color += `00${value.toString(16)}`.slice(-2);
	}
	/* eslint-enable no-bitwise */

	return color;
}
  
function stringAvatar(name: string, image?: string) {
	if (image !== undefined) {
		return {
			alt: name,
			src: image,
			sx: {
				bgcolor: "#FFF",
			},
		};
	}
	return {
		sx: {
			bgcolor: stringToColor(name),
		},
		children: `${name[0]}`,
	};
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

	const PassDates = (props: {created_at: Date, expires_at?: Date}) => {
		if (props.expires_at === undefined || props.expires_at === null) {
			return (
				<Typography align="left" fontSize={14} color="rgba(0,0,0,0.5)">
					Added {Moment(props.created_at).format("DD/MM/YYYY hh:mm A")}
				</Typography>
			)
		}

		const expiresAt = Moment(props.expires_at)
		if (expiresAt.isAfter(Moment.now())) {
			return (
				<Stack direction="row" justifyContent="space-between">
					<Typography align="left" fontSize={14} color="rgba(0,0,0,0.5)">
						Added {Moment(props.created_at).format("DD/MM/YYYY hh:mm A")}
					</Typography>
					<Tooltip title={"Expires at " + expiresAt.format("DD/MM/YYYY")} arrow>
						<History fontSize="small" sx={{ color: "rgba(15,190,0,0.8)"}}/>
					</Tooltip>
				</Stack>
			)
		}

		return (
			<Stack direction="row" justifyContent="space-between">
				<Typography align="left" fontSize={14} color="rgba(0,0,0,0.5)">
					Added {Moment(props.created_at).format("DD/MM/YYYY hh:mm A")}
				</Typography>
				<Tooltip title={"Expired at " + expiresAt.format("DD/MM/YYYY")} arrow>
					<History fontSize="small" sx={{ color: "rgba(255,0,0,0.8)"}}/>
				</Tooltip>
			</Stack>
		)
	}

	return (
		<VaultBase focus={"passes"}>
			<Stack 
				direction="row" 
				justifyContent="space-between"
				sx={{
					padding: { md: 4, xs: 2 },
				}}
			>
				<Typography
					variant="h2"
					color="secondary"
					align="left"
				>
					Passes
				</Typography>
				{
					(passes !== null && passes.length !== 0 && DISABLE_NEW_PASS === "false") &&
					<Button variant="text" onClick={() => {navigate('/passes/new')}}>
						<Add/>
						Add a new pass
					</Button>
				}
			</Stack>
			{ 
				passes === null ? 
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
							{ DISABLE_NEW_PASS === "false" &&
							<Stack direction="row" justifyContent="center" spacing={2}>
								<Button variant="text" onClick={() => {navigate('/passes/new')}}>
									<Add/>
									Add your first pass
								</Button>
							</Stack>
							}
						</>
					) : (
						<>
							<Grid container direction="row" >
								{ passes.map(pass => (
									<Grid key={pass.id} item padding={2} xl={3} lg={4} md={6} xs={12}>
										<Card sx={{ minHeight: 220, display:"flex", flexWrap:"wrap", flexDirection:"column", justifyContent:"space-between" }}>
											<CardHeader
												action={
													<PassMenu passId={pass.id}/>
												}
												title={
													<Typography align="left" fontSize={20} lineHeight={1.5} fontWeight="bold" textTransform="uppercase">
														{pass.name}
													</Typography>
												}
												subheader={ <PassDates created_at={pass.created_at} expires_at={pass.expires_at}/> }
											/>
											<CardContent>
												{ pass.data }
											</CardContent>
											<CardActions sx={{justifyContent: "space-between", minHeight: 52}}>
												{/* <IconButton aria-label="share">
													<Share />
												</IconButton> */}
												<AvatarGroup max={4} spacing={1}>
													{
														pass.applications?.map(item => {
															return ( 
																<Tooltip key={item.id} title={`Shared with ${item.name}`} arrow>
																	<Avatar {...stringAvatar(item.name, item.icon)} aria-label={item.name} />
																</Tooltip>
															)
														})
													}
												</AvatarGroup>
											</CardActions>
										</Card>
									</Grid>
								))}
							</Grid>
						</>
					)
				)
			}
		</VaultBase>
	);
};

export { Passes, NewPass };
export default Passes;
