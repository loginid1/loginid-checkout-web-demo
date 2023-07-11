import { Box, CssBaseline, Grid, Stack, ThemeProvider } from "@mui/material";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import vaultSDK from "../lib/VaultSDK";
import { Profile } from "../lib/VaultSDK/vault/user";
import { AuthService } from "../services/auth";
import { LoginID } from "../theme/theme";
import { Menu } from "./Menu";
import { MenuData, NestedMenu } from "./NestedMenu";
import VaultAppBar from "./VaultAppbar";
import { MenuIcon } from "../theme/icons";
import { ReactComponent as CredentialDefault } from "../assets/sidemenu/Credential/Default.svg";
import { ReactComponent as PassesDefault } from "../assets/sidemenu/DIDs/Default.svg";
import { ReactComponent as AlgorandDefault } from "../assets/sidemenu/Algorand/Default.svg";
import { ReactComponent as ProfileDefault } from "../assets/sidemenu/Profile/Default.svg";

interface VaultBaseInterface {
	focus: string;
}

const menuData: MenuData[] = [
	{
		id: "passkeys",
		icon: <CredentialDefault />,
		title: "Passkeys",
		link: "/passkeys",
		items: [],
		removable: false,
	},
	{
		id: "passes",
		icon: <PassesDefault />,
		title: "Passes",
		link: "/passes",
		items: [],
		removable: false,
	},

	{
		id: "algo",
		icon: <AlgorandDefault />,
		title: "Algorand",
		link: "",
		removable: true,
		items: [
			{
				id: "algo_accounts",
				title: "Manage Account",
				link: "/algorand/accounts",
				items: [],
				removable: false,
			},
			{
				id: "algo_dapps",
				title: "Dapps",
				link: "/algorand/dapps",
				items: [],
				removable: false,
			},
			{
				id: "algo_recovery",
				title: "Recovery",
				link: "/algorand/recovery",
				items: [],
				removable: false,
			},
		],
	},

	{
		id: "developer",
		icon: <ProfileDefault />,
		title: "Developer Console",
		link: "/developer/console",
		items: [],
		removable: false,
	},
];

export const VaultBase: React.FC<VaultBaseInterface> = ({
	focus,
	...props
}) => {
	const navigate = useNavigate();
	const [mobileOpen, setMobileOpen] = useState(false);
	const [profile, setProfile] = useState<Profile | null>(null);
	const [customMenu, setCustomMenu] = useState<MenuData [] >(menuData);

	const mobileMenuHandler = () => {
		setMobileOpen(!mobileOpen);
	};

	useEffect(() => {
		prepareMenu();
		retrieveProfile();
	}, []);

	function prepareMenu()  {
		let pref = AuthService.getPref();
		let scopes : string[]= []
		if( pref != null && pref.scopes != null) {
			scopes = pref.scopes.split(",");
		}
		var item: MenuData;
		var customMenu : MenuData[] = [];
		for (item of menuData){
			if (item.removable) {
				if (scopes.includes(item.id)) {
					customMenu.push(item);
				}
			} else {
				customMenu.push(item);
			}
		}
		setCustomMenu(customMenu);
	}

	async function retrieveProfile() {
		const token = AuthService.getToken();
		if (token) {
			const myProfile = await vaultSDK.getProfile(token);
			setProfile(myProfile);
		} else {
			// redirect to login
			navigate(
				"/login?redisrect_error=" +
					encodeURIComponent("not authorized - please login again")
			);
		}
	}

	return (
		<ThemeProvider theme={LoginID}>
			<Stack
				spacing={{ md: 4, xs: 2 }}
				direction="row"
				sx={{
					display: "flex",
					mr: { md: 4, xs: 2 },
					my: 2,
				}}
			>
				<CssBaseline />
				<NestedMenu
					focus={focus}
					mobileOpen={mobileOpen}
					mobileMenuHandler={mobileMenuHandler}
					items={customMenu}
				/>
				<Stack
					spacing={2}
					sx={{
						width: "100%",
					}}
				>
					<VaultAppBar mobileMenuHandler={mobileMenuHandler} />
					{props.children}
				</Stack>
			</Stack>
		</ThemeProvider>
	);
};
