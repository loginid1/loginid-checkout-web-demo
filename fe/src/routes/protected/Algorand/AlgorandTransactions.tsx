import { Add, ContentCopy, FiberManualRecord } from "@mui/icons-material";
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
  Card,
  alpha,
  CardContent,
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
  TxRecord,
} from "../../../lib/VaultSDK/vault/algo";
import { Profile } from "../../../lib/VaultSDK/vault/user";
import { AuthService } from "../../../services/auth";

export function AlgorandTransactions() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [transactionList, setTransactionList] = useState<TxList>();
  const [transactionDict, setTransactionDict] =
    useState<Map<string, TxRecord[]>>();
  const [transactionDates, setTransactionDates] = useState<string[]>();
  const [myAddress, setMyAddress] = useState<string>("");

  useEffect(() => {
    const address = searchParams.get("address");
    if (address != null) {
      getTransactionList(address);
      setMyAddress(address);
    }
  }, []);

  async function getTransactionList(address: string) {
    const token = AuthService.getToken();
    try {
      if (token) {
        const txList = await vaultSDK.getTransactionList(token, address);
        console.log(txList);
        setTransactionList(txList);
        getTransactionDict(txList);
      } else {
        navigate("/login");
      }
    } catch (error) {
      console.log("get TxList error: " + error);
    }
  }

  function getTransactionDict(txList: TxList) {
    const txDict = txList.transactions?.reduce((dict, tx) => {
      const txDate = ParseUtil.parseDateUnix(tx["round-time"]);
      console.log(tx);
      if (dict.has(txDate)) {
        dict.set(txDate, [...dict.get(txDate)!, tx]);
      } else {
        dict.set(txDate, [tx]);
      }
      return dict;
    }, new Map<string, TxRecord[]>());

    if (txDict) {
      const txDates = [...txDict.keys()];
      txDates.sort();
      setTransactionDates(txDates);
    }

    console.log(txDict);
    setTransactionDict(txDict);
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
                justifyContent: {
                  md: "flex-start",
                  xs: "center",
                },
              }}
            >
              <Stack spacing={2} direction="row" alignItems={"center"}>
                <Typography variant="h2" color="secondary">
                  Transactions: {ParseUtil.displayLongAddress(myAddress)}
                </Typography>
              </Stack>
            </Grid>
            <Grid
              item
              xs={12}
              md={12}
              sx={{
                display: "flex",
                justifyContent: {
                  md: "flex-start",
                  xs: "center",
                },
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
                  {/* <TableCell></TableCell> */}
                  {/* <TableCell>Transaction ID</TableCell> */}
                  {/* <TableCell>Sender</TableCell>/ */}
                  <TableCell align="right">Type</TableCell>
                  <TableCell align="right">Time</TableCell>
                  <TableCell align="right">Fee</TableCell>
                  <TableCell align="right">Description</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transactionList?.transactions?.map((tx) => (
                  <>
                    <TableRow key={tx.id}>
                      {/* <TableCell>
                        <FiberManualRecord
                          color={
                            tx["payment-transaction"].receiver === myAddress
                              ? "success"
                              : "disabled"
                          }
                        />
                      </TableCell>
                      <TableCell align="left">
                        {ParseUtil.displayAddress(tx.id)}
                        <IconButton
                          size="small"
                          onClick={() => copyAddress(tx.id)}
                        >
                          <ContentCopy fontSize="inherit" />
                        </IconButton>
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          color={tx.sender === myAddress ? "secondary" : ""}
                        >
                          {ParseUtil.displayAddress(tx.sender)}
                          <IconButton
                            size="small"
                            onClick={() => copyAddress(tx.sender)}
                          >
                            <ContentCopy fontSize="inherit" />
                          </IconButton>
                        </Typography>
                      </TableCell> */}
                      <TableCell align="right">{tx["tx-type"]}</TableCell>
                      <TableCell align="right">
                        {ParseUtil.parseDateTimeUnix(tx["round-time"])}
                      </TableCell>
                      <TableCell align="right">{tx.fee}</TableCell>
                      <TableCell align="right">
                        {tx["payment-transaction"] ? (
                          <Typography variant="caption">
                            pay {tx["payment-transaction"].amount} mAlgos to
                            &nbsp;
                            <Typography
                              variant="caption"
                              color={
                                tx["payment-transaction"].receiver == myAddress
                                  ? "secondary"
                                  : ""
                              }
                            >
                              {ParseUtil.displayLongAddress(
                                tx["payment-transaction"].receiver
                              )}
                              <IconButton
                                size="small"
                                onClick={() =>
                                  copyAddress(
                                    tx["payment-transaction"].receiver
                                  )
                                }
                              >
                                <ContentCopy fontSize="inherit" />
                              </IconButton>
                            </Typography>
                          </Typography>
                        ) : (
                          <Typography>Invalid</Typography>
                        )}
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
}
