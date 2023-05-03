import { MoreVert, Add, Share } from "@mui/icons-material";
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
} from "@mui/material";
import { useState, useEffect } from "react";
import Moment from "moment";
import vaultSDK from "../../../lib/VaultSDK";
import { Pass } from "../../../lib/VaultSDK/vault/pass";
import { AuthService } from "../../../services/auth";
import { useNavigate } from "react-router-dom";
import { VaultBase } from "../../../components/VaultBase";
import NewPass from "./new";

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
			{ passes === null || passes.length === 0 ? (
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
						{ passes.map((pass) => (
							<Grid item padding={2} xl={3} lg={4} md={6} xs={12}>
								<Card sx={{ minHeight: 300, display:"flex", flexWrap:"wrap", flexDirection:"column", justifyContent:"space-between" }}>
									<CardHeader
										action={
											<IconButton aria-label="settings">
												<MoreVert />
											</IconButton>
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
										<Typography variant="body1">
											{pass.schema === 'email' ? pass.data.email : pass.data.phone_number}
										</Typography>
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
			)}
		</VaultBase>
	);
};

export { Passes, NewPass };
export default Passes;
