import {
	Box,
	Button,
	createTheme,
	Paper,
	ThemeProvider,
	Typography,
	useMediaQuery,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack/Stack";
import MainBackground from "../assets/marketing/m_background_1.png";
import MainScreen from "../assets/marketing/m_screen_1.png";
import Icon30 from "../assets/marketing/m_icon_3_0.svg";
import Icon31 from "../assets/marketing/m_icon_3_1.svg";
import Icon32 from "../assets/marketing/m_icon_3_2.svg";
import Icon33 from "../assets/marketing/m_icon_3_3.svg";
import IconFAQ from "../assets/marketing/m_faq.svg";
import LoginIDLogo from "../assets/sidemenu/LoginIDLogo.svg";
import VaultLogo from "../assets/logoContrast.svg";
import FaqCard from "../components/FaqCard";
import { useNavigate } from "react-router-dom";

export const LoginID = createTheme({
	palette: {
		primary: {
			main: "#1642DF",
			contrastText: "#fff",
		},
		secondary: {
			main: "#1E2898",
		},
		tertiary: {
			main: "#E2F2FF",
		},
		background: {
			default: "#E2EAF9",
		},
		backgroundCard: {
			main: "#F2F2F2",
		},
	},
});
const styles = {
	main: {
		backgroundImage: `url(${MainBackground})`,
		backgroundRepeat: "no-repeat",
		backgroundSize: "contain",
	},
	sectionHeader: {
		background: "#000",
	},
	sectionA: {
		background: "linear-gradient(180deg, #D6EDFF 18.06%, #FAFAFA 100%)",
	},
	sectionFAQ: {
		background: "#FAFAFA",
	},
	fontLogo: {
		fontSize: "20px",
		fontWeight: "400",
	},
	fontMain: {
		fontSize: "40px",
		fontWeight: "900",
	},
	fontFAQtitle: {
		color: "#1E2898",
		fontSize: "32px",
		fontWeight: "700",
	},
	fontDesc: {
		fontSize: "16px",
		fontWeight: "500",
	},
	fontCardTitle: {
		color: "#1E2898",
		fontSize: "20px",
		fontWeight: "700",
		padding: 8,
	},
	fontCardDesc: {
		fontSize: "16px",
	},
	card: {
		height: "100%",
		padding: 16,
	},
};

const faqData = [
	{
		question: "What is the LoginID Wallet?",
		answer: `LoginID Wallet is a device hardware based, secure wallet that provides simple registration and transacting on blockchain.  There are no downloads of software, or plugins required on your device, FIDO biometric authentication is available on 5B+ devices globally today. `,
	},

	{
		question: `Why do I need a LoginID Wallet?`,
		answer: `
        <b>Better Account Recovery</b><br/>
        You will be able to assign multiple devices to your account to access dApps and or perform transactions on dApps. This means, if you lose a device, you can still access dApps using your other devices without the need to remember any passphrases. 
        <br/> 
        <b>Strongest security</b><br/>
        LoginID incorporates the World Wide Web Consortium (W3C)/FIDO Alliance official web standard for web authentication (WebAuthn). Our technology makes passwords and phishing a thing of the past by authenticating through ‘something a user is’ which defends against phishing, privacy attacks, and replay attacks using LoginID’s server side strong authentication. 
        `,
	},
	{
		question: `Why do I need a LoginID Wallet if I already have a crypto wallet?`,
		answer: `<b>No more browser extensions, QR scanning etc </b><br/>
User experiences in today’s wallets are complex and multi-stepped. With our Vault, you no longer need to install an app, sync, import, install browser extensions, etc. FIDO vault is developed across all platforms and devices.`,
	},

	{
		question: `What is FIDO?`,
		answer: `
        <b>FIDO</b> biometric authentication is a standard that was created over 10 years ago and is currently supported by 350+ technology and business partners as the defacto standard for strong customer authentication.  
        <a href="https://loginid.io">LoginID</a> has developed a <b>FIDO-certified</b> strong authentication platform, that the FIDO Vault is built on.

        `,
	},
];

export function Faq() {
	const navigate = useNavigate();
	return (
		<ThemeProvider theme={LoginID}>
			<Grid container>
				<Grid
					item
					container
					sx={{ p: 2, pl: 4 }}
					style={styles.sectionHeader}
					xs={12}
					md={12}
					alignItems="left"
				>
					<Box component="img" src={VaultLogo} />
				</Grid>
				<Grid item xs={12} md={6} style={styles.main}>
					<Box
						component="img"
						sx={{
							m: 8,
							height: 316,
							width: 529,
							maxHeight: { xs: 250, md: 316 },
							maxWidth: { xs: 420, md: 529 },
						}}
						src={MainScreen}
					/>
				</Grid>
				<Grid item container xs={12} md={6}>
					<Stack sx={{ m: 8 }} justifyContent="flex-start">
						<Typography
							style={styles.fontLogo}
							sx={{
								display: "flex",
							}}
							align="left"
						>
							Powered by&nbsp;
							<Box
								component="img"
								sx={{ height: "32px" }}
								src={LoginIDLogo}
								alt="something"
							/>
						</Typography>
						<Typography style={styles.fontMain} align="left">
							The easiest and most secure way to setup a
							blockchain account
						</Typography>
						<Typography style={styles.fontDesc} align="left">
							Utilize a FIDO or Passkeys based device’s hardware
							security to provide a passwordless experience,
							secure your information, transact easier and give
							you a way to recover your account.
						</Typography>
						<Stack direction="row" spacing={2} sx={{ m: 2 }}>
							<Button
								variant="contained"
								onClick={() => navigate("/register")}
								sx={{ borderRadius: 8 }}
							>
								Register for free
							</Button>
							<Button
								variant="outlined"
								onClick={() => navigate("/login")}
								sx={{ borderRadius: 8 }}
							>
								Sign in
							</Button>
						</Stack>
					</Stack>
				</Grid>
				<Grid
					container
					item
					xs={12}
					md={12}
					style={styles.sectionA}
					sx={{ p: 4 }}
					justifyContent="center"
				>
					<Grid
						container
						item
						xs={12}
						md={12}
						sx={{ p: 2 }}
						justifyContent="center"
					>
						<Box component="img" src={Icon30}></Box>
					</Grid>
					<Grid container item xs={12} md={12} spacing={4}>
						<Grid container item xs={12} md={4} sx={{ p: 2 }}>
							<Paper style={styles.card}>
								<Box component="img" src={Icon31} />
								<Typography style={styles.fontCardTitle}>
									Easy To Use
								</Typography>
								<Typography style={styles.fontCardDesc}>
									There are no downloads of software, or
									plugins required on your device. Your device
									likely already supports FIDO and Passkeys.
									Register accounts with one-touch of your
									biometric.
								</Typography>
							</Paper>
						</Grid>
						<Grid container item xs={12} md={4} sx={{ p: 2 }}>
							<Paper style={styles.card}>
								<Box component="img" src={Icon32} />
								<Typography style={styles.fontCardTitle}>
									Secured By Hardware
								</Typography>
								<Typography style={styles.fontCardDesc}>
									LoginID Wallet is a device hardware based,
									secure wallet that provides simple
									registration and transacting on blockchains.
									FIDO and Passkeys biometric authentication
									is available on 5B+ devices globally today.
								</Typography>
							</Paper>
						</Grid>
						<Grid container item xs={12} md={4} sx={{ p: 2 }}>
							<Paper style={styles.card}>
								<Box component="img" src={Icon33} />
								<Typography style={styles.fontCardTitle}>
									Recovered Accounts
								</Typography>
								<Typography style={styles.fontCardDesc}>
									You will be able to assign multiple devices
									to your account to access dApps and/or
									perform transactions on dApps. If you lose a
									device, you can still access dApps using
									your other FIDO device or Passkey without
									the need to remember any passphrases.
								</Typography>
							</Paper>
						</Grid>
					</Grid>
				</Grid>
				<Grid
					container
					item
					xs={12}
					md={12}
					style={styles.sectionFAQ}
					sx={{ p: 4 }}
					direction="column"
					justifyContent="center"
				>
					<Stack
						direction="row"
						justifyContent="center"
						id="faq-section"
					>
						<Box component="img" src={IconFAQ} />
						<Typography style={styles.fontFAQtitle} sx={{ m: 2 }}>
							FAQ's
						</Typography>
					</Stack>
					{faqData.map((set) => (
						<FaqCard
							question={set.question}
							answer={set.answer}
						></FaqCard>
					))}
				</Grid>
				<Grid
					item
					container
					sx={{ p: 2, pl: 4 }}
					style={styles.sectionHeader}
					xs={12}
					md={12}
					alignItems="left"
				></Grid>
			</Grid>
		</ThemeProvider>
	);
}
