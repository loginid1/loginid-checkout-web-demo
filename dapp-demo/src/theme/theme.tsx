import { createTheme } from "@mui/material";
import typography from "./typography";

export const demo_theme = createTheme({
	palette: {
		primary: {
		  light: '#63ccff',
		  main: '#009be5',
		  dark: '#006db3',
		},
	  },
		typography,
	  shape: {
		borderRadius: 8,
	  },
	  components: {
		MuiTab: {
		  defaultProps: {
			disableRipple: true,
		  },
		},
	  },
	  mixins: {
		toolbar: {
		  minHeight: 48,
		},
	  },
	});