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
import { useNavigate, useSearchParams } from "react-router-dom";
import { VaultBase } from "../../../components/VaultBase";
import ParseUtil from "../../../lib/util/parse";
import vaultSDK from "../../../lib/VaultSDK";
import {
  EnableAccount,
  EnableAccountList,
  TxList,
} from "../../../lib/VaultSDK/vault/algo";
import { Profile } from "../../../lib/VaultSDK/vault/user";
import { AuthService } from "../../../services/auth";


export function TransactionReport (){  
  const navigate = useNavigate();
  const [searchParams,setSearchParams] = useSearchParams();

  const [transactionList, setTransactionList] = useState<TxList >();
  
  useEffect(() => {
    const address = searchParams.get("address")
    if(address != null){
      getTransactionList(address);
    }
  }, []);

  async function getTransactionList(address: string) {
    const token = AuthService.getToken();
    if (token) {
      const txList = await vaultSDK.getTransactionList(token, address);
      setTransactionList(txList);
    } else {
      navigate("/login");  
    }
  }

  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
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
                  <TableCell>Transactions</TableCell>
                  <TableCell align="right">Wallet Address</TableCell>
                  <TableCell align="right">Type</TableCell>
                  <TableCell align="right">Time</TableCell>
                  <TableCell align="right">Fee</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transactionList?.transactions?.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={() => copyAddress(tx.sender)}
                      >
                        <ContentCopy />
                      </IconButton>
                      {ParseUtil.displayLongAddress(tx.sender)}
                    </TableCell>
                    <TableCell align="right">{tx["tx-type"]}</TableCell>
                    <TableCell align="right">
                      {ParseUtil.parseDateUnix(tx["round-time"])}
                    </TableCell>
                    <TableCell align="right">{tx.fee}</TableCell>
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

