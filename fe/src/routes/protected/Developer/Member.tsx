import { Paper, Stack, Typography } from "@mui/material";
import { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { DisplayAppUserList } from "../../../components/AppUserList";
import { VaultBase } from "../../../components/VaultBase";
import vaultSDK from "../../../lib/VaultSDK";
import { AppList } from "../../../lib/VaultSDK/vault/developer";
import { AuthService } from "../../../services/auth";

export default function DeveloperConsole() {
	const navigate = useNavigate();
	const [searchParams, setSearchParams] = useSearchParams();
	const { app_id } = useParams();
    const [name, setName] = useState<string> ("");

	useEffect(() => {
		let appName = searchParams.get("name");
		if (appName) {
            setName(appName);
        }
		fetchData();
	}, []);

	async function fetchData() {
	}

	return (
		<VaultBase focus={"developer"}>
			<Stack
				direction="row"
				justifyContent="space-between"
				sx={{
					padding: { md: 4, xs: 2 },
				}}
			>
				<Typography variant="h2" color="secondary" align="left">
                    Members of {name}
				</Typography>
            </Stack>
                { app_id &&
					<Paper
						elevation={0}
						sx={{
							p: { md: 4, xs: 2 },
							mb: 2,
							display: "flex",
							justifyContent: "center",
						}}
					>
                    <DisplayAppUserList appId={app_id}/>
                    </Paper>
                }
		</VaultBase>
	);
}
