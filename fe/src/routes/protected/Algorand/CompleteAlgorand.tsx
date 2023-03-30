import {
  Button,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import { ReactComponent as ALgorandLogo } from "../../../assets/AlgorandLogo.svg";
import { KeyDisplay } from "../../../components/KeyDisplay";
import { VaultBase } from "../../../components/VaultBase";

const CompleteAlgorand: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const address = location.state as string;

  return (
    <VaultBase focus={"algo_accounts"}>
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
            <Typography variant="body1">
              Your new Algorand account has been created! To activate your
              account, please go to your wallet and transfer funds to the
              account below.
            </Typography>
          </Stack>

          <Stack spacing={2} alignItems="center">
            <Typography variant="h3">Account Address</Typography>
            <KeyDisplay color="error" value={address} />
          </Stack>

          <Button
            variant="contained"
            onClick={() => navigate("/algorand_accounts")}
          >
            Complete
          </Button>
          {/* <Link color="#000" onClick={() => navigate("/algorand_accounts")}>
            I will activate later
          </Link> */}
        </Stack>
      </Paper>
    </VaultBase>
  );
};

export default CompleteAlgorand;
