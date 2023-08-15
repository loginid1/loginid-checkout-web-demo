import { ExpandLess, ExpandMore } from "@mui/icons-material";
import {
	ListItemIcon,
	ListItemText,
	ListItem,
	Collapse,
	List,
	SvgIconTypeMap,
	ListItemButton,
	Box,
	Drawer,
	Link,
	Stack,
	ThemeProvider,
	Toolbar,
	Typography,
} from "@mui/material";
import { OverridableComponent } from "@mui/material/OverridableComponent";
import { useEffect, useState } from "react";
import { LoginID } from "../theme/theme";
import { ReactComponent as VaultLogo } from "../assets/logo-inverted.svg";
import menuHeader from "../assets/sidemenu/MenuHeader.png";
import LoginIDLogo from "../assets/sidemenu/LoginIDLogo.svg";
import { useNavigate } from "react-router-dom";

export interface MenuData {
	id: string;
	icon?: React.ReactElement;
	title: string;
	link: string;
	items: MenuData[];
	removable: boolean;
}

export interface NestedMenuProps {
	focus: string;
	mobileOpen?: boolean;
	mobileMenuHandler?: () => void;
	items: MenuData[];
}

const ListItemBody = (props: MenuData) => {
	return (
		<>
			<ListItemIcon>{props.icon}</ListItemIcon>
			<ListItemText primary={props.title} />
		</>
	);
};

function LinkMenuItem(props: { item: MenuData; focus: string }) {
	const navigate = useNavigate();
	return (
		<ListItemButton
			key={props.item.id}
			selected={props.item.id === props.focus}
			onClick={() => {
				navigate(props.item.link);
			}}
		>
			<ListItemBody {...props.item} />
		</ListItemButton>
	);
}

function ExpandableMenuItem(props: { item: MenuData; focus: string }) {
	const [open, setOpen] = useState(false);

	const handleClick = () => {
		setOpen(!open);
	};
	useEffect(() => {
		props.item.items.forEach((item) => {
			if (item.id === props.focus) {
				setOpen(true);
			}
		});
	}, [props]);

	return (
		<List component="nav" key={props.item.id + "list"}>
			<ListItemButton key={props.item.id} onClick={handleClick}>
				<ListItemBody {...props.item} />
				{open ? <ExpandLess /> : <ExpandMore />}
			</ListItemButton>
			<Collapse in={open} timeout="auto" unmountOnExit>
				<NestedMenuItem items={props.item.items} focus={props.focus} />
			</Collapse>
		</List>
	);
}

function NestedMenuItem(props: { items: MenuData[]; focus: string }) {
	function createList(items: MenuData[]) {
		let menu: React.ReactElement[] = [];
		props.items.map((menuItem) => {
			if (Array.isArray(menuItem.items) && menuItem.items.length > 0) {
				menu.push(
					<ExpandableMenuItem key={menuItem.id} item={menuItem} focus={props.focus} />
				);
			} else {
				menu.push(<LinkMenuItem key={menuItem.id} item={menuItem} focus={props.focus} />);
			}
		});
		return menu.concat();
	}

	return <List>{createList(props.items)}</List>;
}

export function NestedMenu(props: NestedMenuProps) {
	const drawerWidth = 300;
	const drawer = (
		<Stack
			sx={{
				height: "100%",
				justifyContent: "space-between"
			}}
		>
			<Box>
				<Toolbar
					sx={{
						maxHeight: 100,
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						backgroundImage: `url(${menuHeader})`,
						backgroundSize: "cover",
						zIndex: "-1",
					}}
				>
					<VaultLogo />
				</Toolbar>

				<Box
					sx={{
						borderRadius: "2%",
						mt: "-10px",
						backgroundColor: "white",
					}}
				>
					<NestedMenuItem items={props.items} focus={props.focus} />
				</Box>
			</Box>
			<Stack
				spacing={2}
				sx={{
					alignItems: "center",
					justifyContent: "center",
					pb: 4,
				}}
			>
				<Link href="#" color="#615E5E" sx={{ textDecoration: "none" }}>
					<Typography variant="body1">Contact Us</Typography>
				</Link>
				<Link href="#" color="#615E5E" sx={{ textDecoration: "none" }}>
					<Typography variant="body1">
						Learn more about FIDO
					</Typography>
				</Link>
				<Typography
					variant="body1"
					color="#1E2898"
					sx={{
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
					}}
				>
					powered by&nbsp;
					<img src={LoginIDLogo} alt="something" />
				</Typography>
			</Stack>
		</Stack>
	);

	return (
		<ThemeProvider theme={LoginID}>
			<Drawer
				variant="permanent"
				anchor="left"
				sx={{
					width: `${drawerWidth}px`,
					minHeight: "100vh",
					flexShrink: 0,
					"& .MuiDrawer-paper": {
						width: `${drawerWidth}px`,
					},
					display: { xs: "none", sm: "inherit" },
					zIndex: 900,
				}}
			>
				{drawer}
			</Drawer>
			<Drawer
				variant="temporary"
				anchor="left"
				open={props.mobileOpen}
				onClose={props.mobileMenuHandler}
				sx={{
					width: "60%",
					minHeight: "100vh",
					flexShrink: 0,
					"& .MuiDrawer-paper": {
						width: "60%",
					},
					display: { xs: "inherit", sm: "none" },
				}}
			>
				{drawer}
			</Drawer>
		</ThemeProvider>
	);
}
