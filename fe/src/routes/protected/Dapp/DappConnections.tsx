import { Add, ContentCopy } from "@mui/icons-material";
import {
  Grid,
  Stack,
  Typography,
  Button,
  TableContainer,
  Table,
  TableHead,
  Paper,
  TableCell,
  TableRow,
  TableBody,
  IconButton,
} from "@mui/material";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { VaultBase } from "../../../components/VaultBase";
import ParseUtil from "../../../lib/util/parse";
import vaultSDK from "../../../lib/VaultSDK";
import {
  EnableAccount,
  EnableAccountList,
} from "../../../lib/VaultSDK/vault/algo";
import { Profile } from "../../../lib/VaultSDK/vault/user";
import { AuthService } from "../../../services/auth";

const DappConnections: React.FC = () => {
  const navigate = useNavigate();

  const [accountList, setAccountList] = useState<EnableAccountList | null>(
    null
  );

  useEffect(() => {
    getEnableAccountList();
  }, [accountList]);

  async function getEnableAccountList() {
    const token = AuthService.getToken();
    if (token) {
      const accountList = await vaultSDK.getEnableAccountList(token);
      console.log(accountList);
      setAccountList(accountList);
    } else {
    }
  }

  async function revokeEnableAccount(account: EnableAccount) {
    const token = AuthService.getToken();
    if (token) {
      await vaultSDK.revokeEnableAccount(token, account.id);
    } else {
    }
  }

  const copyAddress = (account: EnableAccount) => {
    navigator.clipboard.writeText(account.wallet_address);
  };
  return (
    <VaultBase focus={2}>
      <Paper
        elevation={0}
        sx={{
          p: { md: 4, xs: 2 },
          mb: 2,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <Grid container spacing={{ md: 4, xs: 2 }} direction="column">
          <Grid item xs container direction="row" spacing={2}>
            <Grid
              item
              xs={12}
              sx={{
                display: "flex",
                justifyContent: { md: "flex-start", xs: "center" },
              }}
            >
              <Stack spacing={2} direction="row" alignItems={"center"}>
                <Typography variant="h2" color="secondary">
                  Dapp Connections
                </Typography>
              </Stack>
            </Grid>
            <Grid
              item
              xs={12}
              md={12}
              sx={{
                display: "flex",
                justifyContent: { md: "flex-start", xs: "center" },
                maxWidth: "400px",
              }}
            >
              {/* DESCRIPTION */}
            </Grid>
          </Grid>

          <TableContainer
            sx={{
              pl: { md: 4, xs: 2 },
            }}
          >
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Revoke Connection</TableCell>
                  <TableCell align="right">Wallet Address</TableCell>
                  <TableCell align="right">Added</TableCell>
                  <TableCell align="right">Dapp Origin</TableCell>
                  <TableCell align="right">Network</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {accountList?.accounts?.map((account) => (
                  <TableRow key={account.id}>
                    <TableCell component="th" scope="row">
                      <Button
                        variant="outlined"
                        color="error"
                        onClick={() => revokeEnableAccount(account)}
                      >
                        Revoke
                      </Button>
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={() => copyAddress(account)}
                      >
                        <ContentCopy />
                      </IconButton>
                      {ParseUtil.displayLongAddress(account.wallet_address)}
                    </TableCell>
                    <TableCell align="right">
                      {ParseUtil.parseDate(account.iat)}
                    </TableCell>
                    <TableCell align="right">{account.dapp_origin}</TableCell>
                    <TableCell align="right">{account.network}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Paper>
    </VaultBase>
  );
};

export default DappConnections;
