import { createContext } from "react";
import { MessagingService } from "../../services/messaging";
import { DisplayMessage } from "../common/message";

export enum AuthPage {
	NONE = "none",
	ERROR = "error",
	LOGIN = "login",
	FIDO_REG = "fido_register",
	CONSENT = "consent",
	PHONE_PASS = "phone_pass",
	FINAL = "final",
}

export interface ConsentContextType {
    postMessageText: (text: string) => void;
	setPage: (page: AuthPage) => void;
	handleCancel: () => void;
	setDisplayMessage: (msg: DisplayMessage) => void;
}

export const ConsentContext = createContext<ConsentContextType | null>(null);


export interface AuthContextType {
    username: string;
    setUsername: (username: string) => void;
    postMessage: (type: string, text: string) => void;
	setPage: (page: AuthPage) => void;
	handleCancel: () => void;
    setToken: (token: string) => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);