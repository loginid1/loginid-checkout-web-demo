import { CheckoutRequest } from "../lib/checkout";
import { Theme } from "@mui/material";

export interface CheckoutProps {
  screenWidth: number;
  request: CheckoutRequest;
  submit: () => void;
}

export interface CallbackProps {
  name: string;
  amount: string;
  theme: Theme;
  back: () => void;
}

export interface ErrorProps {
  name: string;
  error: string;
  theme: Theme;
  back: () => void;
}
