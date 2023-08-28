import {
	Card,
	CardContent,
	CardHeader,
	Collapse,
	IconButton,
} from "@mui/material";
import { ReactNode } from "react";
import MoreVertIcon from "@mui/icons-material/MoreVert";

export interface SectionCardProps {
	title: string;
	children: ReactNode;
	expandable: boolean;
}

export function SectionCard(props: SectionCardProps) {
	return (
		<Card
			sx={{
				"& .MuiCardHeader-root": {
					backgroundColor: "#EEEEEE",
				},
				"& .MuiCardHeader-title": {
					color: "text.primary",
					fontSize: 16,
					textAlign: "left",
				},
			}}
		>
			<CardHeader
				action={
                    props.expandable &&
					<IconButton aria-label="settings">
						<MoreVertIcon />
					</IconButton>
				}
				title={props.title}
			></CardHeader>
				<CardContent>{props.children}</CardContent>
		</Card>
	);
}
