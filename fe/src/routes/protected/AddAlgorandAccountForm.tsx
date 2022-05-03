import {
  Alert,
  AlertColor,
  alpha,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  CssBaseline,
  Grid,
  Link,
  Paper,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  ThemeProvider,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { Menu } from "../../components/Menu";
import VaultAppBar from "../../components/VaultAppbar";
import { LoginID } from "../../theme/theme";
import { ArrowBack, Check } from "@mui/icons-material";
import vaultSDK from "../../lib/VaultSDK";
import AddImg from "../../assets/AddAlgorantAccount.png";
import { ReactComponent as AlgorandLogo } from "../../assets/AlgorandLogo.svg";
import { useEffect, useState } from "react";
import {
  Credentials,
  RecoveryList,
  RecoveryPhrase,
} from "../../lib/VaultSDK/vault/user";
import { AuthService } from "../../services/auth";
import { CredentialCards } from "../../components/CredentialCard";
import { RecoveryCard } from "../../components/RecoveryCard";
import { DisplayMessage } from "../../lib/common/message";
import {
  AlgoAccountCreationRequest,
  ContractAccount,
} from "../../lib/VaultSDK/vault/algo";

const AddAlgorandAccountForm: React.FC = () => {
  const navigate = useNavigate();

  const [credentials, setCredentials] = useState<Credentials | null>(null);
  const [recoveryList, setRecoveryList] = useState<RecoveryList | null>(null);
  const [formCredentialList, setFormCredentialList] = useState<string[]>([]);
  const [formCredIDList, setFormCredIDList] = useState<string[]>([]);
  const [formRecovery, setFormRecovery] = useState<string>("");
  const [displayMessage, setDisplayMessage] = useState<DisplayMessage | null>(
    null
  );
  const [aliasName, setAliasName] = useState("");

  useEffect(() => {
    retrieveLists();
  }, []);

  async function retrieveLists() {
    const token = AuthService.getToken();
    if (token) {
      const myCredentials = await vaultSDK.getCredentials(token);
      const recoveryList = await vaultSDK.getRecoveryList(token);
      setCredentials(myCredentials);
      setRecoveryList(recoveryList);
    } else {
    }
  }

  async function handleAccountCreation() {
    if (aliasName.length <= 0) {
      setDisplayMessage({ text: "Alias is empty", type: "error" });
      return;
    }
    if (formCredentialList.length <= 0) {
      setDisplayMessage({
        text: "Must have atleast one credential",
        type: "error",
      });
      return;
    }
    if (formRecovery.length <= 0) {
      setDisplayMessage({ text: "Recovery is required", type: "error" });
      return;
    }

    console.log("credID: ", formCredIDList);

    const token = AuthService.getToken();
    if (token) {
      try {
        const script = await vaultSDK.generateScript(
          token,
          formCredentialList,
          formRecovery
        );

        const request: AlgoAccountCreationRequest = {
          verify_address: script.address,
          cred_id_list: formCredIDList,
          recovery: formRecovery,
        };

        const response = await vaultSDK.createAccount(token, request);

        navigate("/complete_algorand_account", {
          state: script.address,
        });
      } catch (error) {
        setDisplayMessage({ text: (error as Error).message, type: "error" });
      }
    } else {
      setDisplayMessage({
        text: "missing auth token - retry login",
        type: "error",
      });
      return;
    }
  }

  const handleChangeCredential = (
    id: string,
    key: string,
    isClicked: boolean
  ) => {
    if (isClicked) {
      setFormCredIDList((oldList) => [...oldList, id]);
      setFormCredentialList((oldList) => [...oldList, key]);
    } else {
      setFormCredIDList(formCredIDList.filter((item) => item !== id));
      setFormCredentialList(formCredentialList.filter((item) => item !== key));
    }
  };

  const handleChangeRecovery = (recovery: string) => {
    setFormRecovery(recovery);
  };

  return (
    <ThemeProvider theme={LoginID}>
      <Box
        sx={{
          display: "flex",
        }}
      >
        <CssBaseline />
        <Menu focus={1} />

        <Box
          component="main"
          sx={{
            flexGrow: 1,
            height: "100vh",
            paddingX: 4,
          }}
        >
          <Box
            sx={{
              height: "100%",
              width: "100%",
              mt: 2,
            }}
          >
            <Grid container spacing={2} marginRight={10}>
              <Grid item xs={12} md={12} lg={12}>
                <VaultAppBar />
              </Grid>
              <Grid item xs={12} md={12} lg={12}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 6,
                    mb: 2,
                    display: "flex",
                    justifyContent: "center",
                  }}
                >
                  <Stack
                    spacing={6}
                    sx={{width:"100%", maxWidth:"100%"}}
                    alignItems="center"
                  >
                    <Stack spacing={2} alignItems="center">
                      <AlgorandLogo />
                      <Typography variant="h2" color="secondary">
                        Create Algorand Account
                      </Typography>
                    </Stack>
                    {displayMessage && (
                      <Alert
                        severity={
                          (displayMessage?.type as AlertColor) || "info"
                        }
                        sx={{ mt: 4 }}
                      >
                        {displayMessage.text}
                      </Alert>
                    )}

                    <Stack spacing={2} alignItems="center" maxWidth="400px">
                      <Typography variant="h3">
                        Name your Algorand Account
                      </Typography>
                      <TextField
                        fullWidth
                        onChange={(e) => setAliasName(e.target.value)}
                      ></TextField>
                    </Stack>

                    <Stack spacing={2}>
                      <Typography variant="h3">
                        Select your credential
                      </Typography>
                      <Stack direction="row" spacing={2}>
                        {credentials?.credentials?.map((credential) => (
                          <Card
                            variant="outlined"
                            sx={{
                              width: "100",
                              backgroundColor: alpha("#F2F2F2", 0.2),
                            }}
                            elevation={0}
                          >
                            <CardContent>
                              <Stack
                                spacing={2}
                                alignItems="start"
                                direction="row"
                              >
                                <Checkbox
                                  onChange={(e) =>
                                    handleChangeCredential(
                                      credential.id,
                                      credential.public_key,
                                      e.target.checked
                                    )
                                  }
                                ></Checkbox>
                                <CredentialCards
                                  credential={credential}
                                ></CredentialCards>
                              </Stack>
                            </CardContent>
                          </Card>
                        ))}
                      </Stack>
                    </Stack>

                    <Stack spacing={2}>
                      <Typography variant="h3">
                        Select your recovery option
                      </Typography>
                      {recoveryList?.recovery.map((recovery) => (
                        <Card
                          variant="outlined"
                          sx={{
                            width: "100%",
                            backgroundColor: alpha("#F2F2F2", 0.2),
                          }}
                          elevation={0}
                        >
                          <CardContent>
                            <Stack
                              direction="row"
                              justifyContent="space-between"
                              alignItems="center"
                            >
                              <Radio
                                checked={formRecovery === recovery.public_key}
                                onChange={() =>
                                  handleChangeRecovery(recovery.public_key)
                                }
                              />
                              <RecoveryCard
                                recovery={recovery}
                                showCopy={false}
                              ></RecoveryCard>
                              <Box>
                                <Stack direction="row" spacing={2}>
                                  <Button variant="outlined" color="primary">
                                    Show Details
                                  </Button>
                                </Stack>
                              </Box>
                            </Stack>
                          </CardContent>
                        </Card>
                      ))}
                    </Stack>

                    <Stack direction="row" spacing={2}>
                      <Button onClick={() => navigate("/algorand_accounts")}>
                        <ArrowBack />
                        &nbsp;Back
                      </Button>

                      <Button
                        variant="contained"
                        onClick={handleAccountCreation}
                      >
                        Create Account
                      </Button>
                    </Stack>
                  </Stack>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default AddAlgorandAccountForm;
function setDisplayMessage(arg0: { text: string; type: string }) {
  throw new Error("Function not implemented.");
}

function formCredIDList(arg0: string, formCredIDList: any) {
  throw new Error("Function not implemented.");
}
