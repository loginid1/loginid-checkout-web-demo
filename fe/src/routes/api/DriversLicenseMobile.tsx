import { ThemeProvider, Container, CssBaseline, Paper} from "@mui/material";
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import vaultSDK from "../../lib/VaultSDK";
import { DriversLicensePass as BasePass } from "../../lib/VaultSDK/vault/pass";
import { LoginID } from "../../theme/theme";
import background from "../../assets/background.svg";
import DocumentPass from "../../components/DocumentPass";

const DriversLicenseMobile = () => {
    const [pass, setPass] = useState<BasePass|null>(null);
    const [token, setToken] = useState<string>("");
    const [credentialId, setCredentialId] = useState<string>("");
    const [authToken, setAuthToken] = useState<string>("");
    const [passName, setPassName] = useState<string>("");
    const [passType, setPassType] = useState<string>("");
    const [failed, setFailed] = useState<boolean>(false);
    const { session } = useParams();

    useEffect(() => {
        const verifySession = async () => {
            try {
                const data = await vaultSDK.driversLicenseMobileVerify(session as string);
                setAuthToken(data.authentication_token);
                setPassName(data.pass_name);
                setPassType(data.pass_type);
            } catch (err) {
                setFailed(true);
                console.error(err);
            }
        };
        verifySession();

    }, [session]);

    const handleSuccess = async () => {
        try {
            await vaultSDK.driversLicenseMobileComplete(authToken, session as string, credentialId, token, pass as BasePass);
        } catch (err) {
            console.error(err);
        }
    };

    if (failed) {
        return (
            <ThemeProvider theme={LoginID}>
                <CssBaseline />
                <Container
                    component="main"
                    maxWidth={false}
                    sx={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        backgroundImage: `url(${background})`,
                        height: `${window.innerHeight}px`,
                    }}
                >
                    <Paper
                        elevation={0}
                        sx={{
                            width: "100%",
                            p: { md: 6, xs: 2 },
                            borderRadius: "2%",
                        }}
                    >
                        Invalid Session
                    </Paper>
                </Container>
            </ThemeProvider>
        )
    }

    return (
        <ThemeProvider theme={LoginID}>
            <CssBaseline />
			<Container
				component="main"
				maxWidth={false}
				sx={{
					display: "flex",
					justifyContent: "center",
					alignItems: "center",
					backgroundImage: `url(${background})`,
					height: `${window.innerHeight}px`,
				}}
			>
                <Paper
					elevation={0}
					sx={{
                        width: "100%",
						p: { md: 6, xs: 2 },
						borderRadius: "2%",
					}}
				>
                    <DocumentPass 
                        token={token}
                        credentialId={credentialId}
                        authToken={authToken} 
                        handleCancel={() => { }}
                        handleSuccess={handleSuccess}
                        passName={passName}
                        passType={passType}
                        setPass={setPass}
                        setToken={setToken}
                        setCredentialId={setCredentialId}
                    />
                </Paper>
            </Container>
        </ThemeProvider>
    )
}

export default DriversLicenseMobile;
