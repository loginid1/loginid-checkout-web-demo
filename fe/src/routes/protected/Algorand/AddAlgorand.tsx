import {
  Button,
  Link,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { ArrowBack } from "@mui/icons-material";
import vaultSDK from "../../../lib/VaultSDK";
import AddImg from "../../../assets/AddAlgorantAccount.png";
import { ReactComponent as ALgorandLogo } from "../../../assets/AlgorandLogo.svg";
import { useEffect, useState } from "react";
import { AuthService } from "../../../services/auth";
import { VaultBase } from "../../../components/VaultBase";

const AddAlgorand: React.FC = () => {
  const navigate = useNavigate();

  const [isCredential, setIsCredential] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);

  useEffect(() => {
    retrieveLists();
  }, []);

  async function retrieveLists() {
    const token = AuthService.getToken();
    if (token) {
      const myCredentials = await vaultSDK.getCredentials(token);
      const recoveryList = await vaultSDK.getRecoveryList(token);

      setIsCredential(myCredentials.credentials.length > 0);
      setIsRecovery(recoveryList.recovery.length > 0);
    } else {
    }
  }

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
          maxWidth="400px"
          alignItems="center"
          justifyContent="space-evenly"
        >
          <Stack spacing={2} alignItems="center">
            <ALgorandLogo />
            <Typography variant="h2" color="secondary">
              Create Algorand Account
            </Typography>
          </Stack>
          <Stack spacing={2} alignItems="center">
            <Typography variant="body1" display="inline">
              Let’s create your first Algorand account in 5 steps. You will need{" "}
              <Typography
                variant="body1"
                display="inline"
                color={isCredential ? "primary" : "error"}
                fontWeight={700}
              >
                1 Credential
              </Typography>{" "}
              +{" "}
              <Typography
                variant="body1"
                display="inline"
                color={isRecovery ? "primary" : "error"}
                fontWeight={700}
              >
                1 Recovery Option
              </Typography>
            </Typography>
          </Stack>
          <img src={AddImg} alt="Add Algorand" height="auto" />

          <Typography>
            Not ready yet?
            <div />
            Go to <Link onClick={() => navigate("/home")}>
              My Credentials
            </Link>{" "}
            to set up.
          </Typography>
          <Stack direction="row" spacing={2}>
            <Button onClick={() => navigate("/algorand_accounts")}>
              <ArrowBack />
              &nbsp;Back
            </Button>

            <Button
              variant="contained"
              disabled={!(isRecovery && isCredential)}
              onClick={() => navigate("/add_algorand_account_form")}
            >
              Create Account
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </VaultBase>
  );
};

export default AddAlgorand;
