import { IconButton, Stack, Typography } from "@mui/material";
import Box from "@mui/material/Box";
import { ExpandLess, ExpandMore } from "@mui/icons-material";
import { useState } from "react";

export interface FaqProps {
	question: string;
	answer: string;
}

const styles = {
	question: {
		height: "52px",
		border: "1px solid #EAEAEA",
		borderRadius: "2px",
		display: "flex",
		alignItems: "center",
		paddingLeft: 32,
	},
	answer: {
		border: "1px solid #EAEAEA",
		borderRadius: "2px",
		display: "flex",
		alignItems: "center",
		paddingLeft: 32,
	},
};

export default function FaqCard(props: FaqProps) {
	const [active, setActive] = useState<boolean>(false);
	return (
		<Stack sx={{ m: 2 }}>
			<Box
				style={styles.question}
				sx={{
					color: active ? "#FFFFFF" : "#000000",
					backgroundColor: active ? "#2870FA" : "#FFFFFF",
				}}
				onClick={(e) => setActive(!active)}
				justifyContent="space-between"
			>
				<Typography align="left">{props.question}</Typography>
				<IconButton
					sx={{
						color: active ? "#FFFFFF" : "#000000",
					}}
				>
					{active ? <ExpandLess /> : <ExpandMore />}
				</IconButton>
			</Box>
			{active && (
				<Box style={styles.answer} sx={{ p: 2 }}>
					<Typography
						align="left"
						dangerouslySetInnerHTML={{
							__html: props.answer,
						}}
					></Typography>
				</Box>
			)}
		</Stack>
	);
}
