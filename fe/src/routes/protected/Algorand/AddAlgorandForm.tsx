import {
  Alert,
  AlertColor,
  alpha,
  Button,
  Card,
  CardContent,
  Checkbox,
  Grid,
  Paper,
  Radio,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { ArrowBack } from "@mui/icons-material";
import vaultSDK from "../../../lib/VaultSDK";
import { ReactComponent as AlgorandLogo } from "../../../assets/AlgorandLogo.svg";
import { useEffect, useState } from "react";
import {
  Credentials,
  RecoveryList,
} from "../../../lib/VaultSDK/vault/user";
import { AuthService } from "../../../services/auth";
import { CredentialCards } from "../../../components/CredentialCard";
import { RecoveryCard } from "../../../components/RecoveryCard";
import { DisplayMessage } from "../../../lib/common/message";
import {
  AlgoAccountCreationRequest,
} from "../../../lib/VaultSDK/vault/algo";
import { VaultBase } from "../../../components/VaultBase";

const AddAlgorandForm: React.FC = () => {
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
          alias: aliasName,
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
    <VaultBase focus={1}>
      <Paper
        elevation={0}
        sx={{
          p: { md: 4, xs: 2 },
          mb: 2,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <Stack
          spacing={{ md: 4, xs: 2 }}
          sx={{ width: "100%", maxWidth: "100%" }}
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
              severity={(displayMessage?.type as AlertColor) || "info"}
              sx={{ mt: 4 }}
            >
              {displayMessage.text}
            </Alert>
          )}

          <Stack spacing={2} width="100%" maxWidth="400px">
            <Typography variant="h3">Name your Algorand Account</Typography>
            <TextField
              fullWidth
              onChange={(e) => setAliasName(e.target.value)}
            ></TextField>
          </Stack>

          <Grid
            container
            spacing={2}
            sx={{
              maxWidth: { xs: "400px", md: "50vw" },
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Grid item xs={12}>
              {" "}
              <Typography variant="h3">Select your credential(s)</Typography>
            </Grid>
            {credentials?.credentials?.map((credential) => (
              <Grid item xs={12} sm={12} md={6}>
                <Card
                  key={credential.id}
                  variant="outlined"
                  sx={{
                    backgroundColor: alpha("#F2F2F2", 0.2),
                  }}
                  elevation={0}
                >
                  <CardContent>
                    <Stack spacing={2} alignItems="start" direction="row">
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
              </Grid>
            ))}
          </Grid>

          <Grid
            container
            spacing={2}
            sx={{
              maxWidth: { xs: "400px", md: "50vw" },
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Grid item xs={12}>
              <Typography variant="h3">Select your recovery option</Typography>
            </Grid>
            {recoveryList?.recovery.map((recovery) => (
              <Grid item xs={12} sm={12} md={6}>
                <Card
                  key={recovery.id}
                  variant="outlined"
                  sx={{
                    display: "flex",
                    justifyContent: "flex-start",
                    alignItems: "center",
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
                      <Stack direction="row" spacing={2}>
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
                      </Stack>
                      {/* <IconButton>
                                <Info/>
                              </IconButton> */}
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Stack direction="row" spacing={2}>
            <Button onClick={() => navigate("/algorand_accounts")}>
              <ArrowBack />
              &nbsp;Back
            </Button>

            <Button variant="contained" onClick={handleAccountCreation}>
              Next
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </VaultBase>
  );
};

export default AddAlgorandForm;
