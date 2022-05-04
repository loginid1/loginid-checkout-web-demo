import {
  Box,
  Button,
  CssBaseline,
  Dialog,
  DialogContentText,
  Grid,
  Paper,
  Stack,
  TextField,
  ThemeProvider,
  Typography,
} from "@mui/material";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthService } from "../../services/auth";
import { LoginID } from "../../theme/theme";
import { Menu } from "../../components/Menu";
import VaultAppBar from "../../components/VaultAppbar";
import AddImg from "../../assets/AddCredential.png";
import { ArrowBack } from "@mui/icons-material";
import vaultSDK from "../../lib/VaultSDK";
import { VaultBase } from "../../components/VaultBase";

const AddCredential: React.FC = () => {
  const navigate = useNavigate();

  const [credentialCode, setCredentialCode] = useState("");
  const [credentialName, setCredentialName] = useState("");
  const [isCodeGenerated, setIsCodeGenerated] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [openCredential, setOpenCredential] = useState(false);

  async function generateCredentialCode(): Promise<string | null> {
    const token = AuthService.getToken();
    if (token) {
      const response = await vaultSDK.generateCredentialCode(token);
      return response.code;
    }
    return null;
  }

  const handleClickOpenCredential = async () => {
    const code = await generateCredentialCode();
    if (code != null) {
      setCredentialCode(code);
      setOpenCredential(true);
    }
  };

  const handleCloseCredential = () => {
    setOpenCredential(false);
    setIsCodeGenerated(true);
    navigate("/complete_credential");
  };

  const handleRestartCredential = () => {
    setIsCodeGenerated(false);
    setCredentialCode("");
    setCredentialName("");
  };

  const handleCompleteCredential = () => {
    navigate("/complete_credential");
  };

  return (
    <VaultBase focus={0}>
      <Paper
        elevation={0}
        sx={{
          p: 6,
          display: "flex",
          justifyContent: "center",
        }}
      >
        {!isCodeGenerated ? (
          <Stack
            spacing={6}
            direction="column"
            maxWidth="400px"
            alignItems={"center"}
          >
            <Typography variant="h2" color="secondary">
              Add New Credential
            </Typography>
            <Typography variant="body1">
              Credentials are a combination of browsers and devices used to give
              you access to your account. A Registration Code is a 6-digit code
              that will allow you to register a new credential with this
              account.
            </Typography>

            <img src={AddImg} alt="Add Credential" />

            <Typography variant="body1">
              When you have your other device ready, select Get Registration
              Code.
            </Typography>
            <Stack direction="row" spacing={2}>
              <Button onClick={() => navigate("/home")}>
                <ArrowBack />
                &nbsp;Back
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={handleClickOpenCredential}
              >
                Get Registration Code
              </Button>
            </Stack>
          </Stack>
        ) : (
          <Stack spacing={6}>
            <Typography variant="h2" color="secondary">
              Name New Credential
            </Typography>
            <TextField
              label="Credential name"
              onChange={(e) => setCredentialName(e.target.value)}
              focused
            />
            <Stack direction="row" spacing={2}>
              <Button onClick={handleRestartCredential}>
                <ArrowBack />
                &nbsp;Back
              </Button>
              <Button color="primary" onClick={handleCompleteCredential}>
                Next
              </Button>
            </Stack>
          </Stack>
        )}

        <Dialog
          open={openCredential}
          onClose={handleCloseCredential}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
          sx={{
            p: 4,
          }}
        >
          <Stack
            spacing={2}
            sx={{
              alignItems: "center",
              p: 6,
              width: "400px",
            }}
          >
            <Typography variant="h2" color="secondary" id="alert-dialog-title">
              Your Registration Code
            </Typography>
            <Typography
              variant="body1"
              id="alert-dialog-description"
              textAlign="center"
            >
              Enter this 6-digit code on your other device in order to add it to
              Your Credentials.
            </Typography>
            <Typography variant="h2" color="primary">
              {credentialCode}
            </Typography>
            <DialogContentText>
              This code will expire in 5 minutes
            </DialogContentText>

            <Button
              variant="contained"
              color="primary"
              onClick={handleCloseCredential}
            >
              Close
            </Button>
          </Stack>
        </Dialog>
      </Paper>
    </VaultBase>
  );
};

export default AddCredential;
