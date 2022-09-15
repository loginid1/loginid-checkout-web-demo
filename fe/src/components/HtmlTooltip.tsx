import styled from "@emotion/styled";
import { TooltipProps, Tooltip, tooltipClasses, makeStyles } from "@mui/material";
import styles from "../styles/common.module.css";

export const HtmlTooltip = styled(({ className, ...props }: TooltipProps) => (
    <Tooltip {...props} classes={{ popper: className, arrow: styles.arrow }} />
  ))(({ theme }) => ({
    [`& .${tooltipClasses.tooltip}`]: {
      backgroundColor: '#1E2898',
      maxWidth: 300,
      border: '1px solid #dadde9',
    },
  }));