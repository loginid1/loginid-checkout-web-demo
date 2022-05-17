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
  ListItemSecondaryAction,
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


export function AlgorandTransactions (){  
  const navigate = useNavigate();
  const [searchParams,setSearchParams] = useSearchParams();

  const [transactionList, setTransactionList] = useState<TxList >();
  
  useEffect(() => {
    const address = searchParams.get("address")
    if(address != null){
      console.log(address);
      getTransactionList(address);
    }
  }, []);

  async function getTransactionList(address: string) {
    const token = AuthService.getToken();
    try {

    if (token) {
      const txList = await vaultSDK.getTransactionList(token, address);
      console.log(txList);
      setTransactionList(txList);
    } else {
      navigate("/login");  
    }
    } catch (error) {
      console.log("get TxList error: " +error);
    }
  }

  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
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
                  Transactions
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
                  <TableCell>ID</TableCell>
                  <TableCell align="right">Sender</TableCell>
                  <TableCell align="right">Type</TableCell>
                  <TableCell align="right">Time</TableCell>
                  <TableCell align="right">Fee</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transactionList?.transactions?.map((tx) => (
                  <>
                  <TableRow key={tx.id}>
                    <TableCell align="right">
                      {ParseUtil.displayAddress(tx.id)}
                      <IconButton
                        size="small"
                        onClick={() => copyAddress(tx.id)}
                      >
                        <ContentCopy />
                      </IconButton>
                    </TableCell>
                    <TableCell align="right">
                      {ParseUtil.displayLongAddress(tx.sender)}
                      <IconButton
                        size="small"
                        onClick={() => copyAddress(tx.sender)}
                      >
                        <ContentCopy />
                      </IconButton>
                    </TableCell>
                    <TableCell align="right">{tx["tx-type"]}</TableCell>
                    <TableCell align="right">
                      {ParseUtil.parseDateUnix(tx["round-time"])}
                    </TableCell>
                    <TableCell align="right">{tx.fee}</TableCell>
                  </TableRow>
                  <TableRow sx= {{backgroundColor:"#eceff1"}}>
                    <TableCell colSpan={5}>
                      {tx["payment-transaction"] &&
                      <Typography variant="caption">
                        pay {tx["payment-transaction"].amount} mAlgos to {ParseUtil.displayLongAddress(tx["payment-transaction"].receiver)}
                      </Typography>
                      }
                    </TableCell>
                  </TableRow>
                  </>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Paper>
    </VaultBase>
  );
};

