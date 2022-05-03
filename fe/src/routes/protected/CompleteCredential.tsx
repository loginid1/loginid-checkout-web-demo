import {
  Box,
  Button,
  CssBaseline,
  Grid,
  Paper,
  Stack,
  ThemeProvider,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { Menu } from "../../components/Menu";
import VaultAppBar from "../../components/VaultAppbar";
import { LoginID } from "../../theme/theme";
import CompleteImg from "../../assets/CompleteCredential.png";

const CompleteCredential: React.FC = () => {
  const navigate = useNavigate();

  return (
    <ThemeProvider theme={LoginID}>
      <Box
        sx={{
          display: "flex",
        }}
      >
        <CssBaseline />
        <Menu focus={0}/>

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
                    direction="column"
                    maxWidth="400px"
                    alignItems="center"
                    justifyContent="space-evenly"
                  >
                    <Typography variant="h2" color="secondary">
                      New Credential Created
                    </Typography>
                    <Typography variant="body1">
                      Congratulations! You have successfully created a new
                      credential from your current device/browser.
                    </Typography>
                    <img
                      src={CompleteImg}
                      alt="Complete Credential"
                      width="auto"
                    />
                    <Typography variant="body1">
                      When you have your other device ready, select Get
                      Registration Code.
                    </Typography>
                    <Button
                      variant="outlined"
                      onClick={() => navigate("/home")}
                    >
                      Return To Main Menu
                    </Button>
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

export default CompleteCredential;
