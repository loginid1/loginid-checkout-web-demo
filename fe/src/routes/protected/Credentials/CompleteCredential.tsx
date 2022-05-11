import {
  Button,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import CompleteImg from "../../../assets/CompleteCredential.png";
import { VaultBase } from "../../../components/VaultBase";

const CompleteCredential: React.FC = () => {
  const navigate = useNavigate();

  return (
    <VaultBase focus={0}>
      <Paper
        elevation={0}
        sx={{
          p: { md: 4, xs: 2 },
          display: "flex",
          justifyContent: "center",
        }}
      >
        <Stack
          spacing={{ md: 4, xs: 2 }}
          direction="column"
          maxWidth="400px"
          alignItems="center"
        >
          <Typography variant="h2" color="secondary">
            New Credential Created
          </Typography>
          <Typography variant="body1">
            Congratulations! You have successfully created a new credential from
            your current device/browser.
          </Typography>
          <img src={CompleteImg} alt="Complete Credential" />
          <Typography variant="body1">
            When you have your other device ready, select Get Registration Code.
          </Typography>
          <Button variant="outlined" onClick={() => navigate("/home")}>
            Return To Main Menu
          </Button>
        </Stack>
      </Paper>
    </VaultBase>
  );
};

export default CompleteCredential;
