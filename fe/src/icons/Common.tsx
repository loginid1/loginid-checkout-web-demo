
import { SvgIcon } from "@mui/material";
import { ReactComponent as AlgoLogo } from "../assets/AlgoLogo.svg";
export function AlgoIcon(props : any) {
	return (
	  <SvgIcon {...props} component={AlgoLogo} inheritViewBox>
	  </SvgIcon>
	);
  }