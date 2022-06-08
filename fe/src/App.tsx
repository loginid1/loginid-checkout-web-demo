import React, { useState } from 'react';


import { Routes, Route, Link, Navigate } from "react-router-dom";
import './App.css';
import Register from './routes/Register';
import Login from './routes/Login';
import AddDevice from './routes/AddDevice';
import Home from './routes/protected/Home';
import ProtectedRoute from './routes/util/ProtectedRoute';
import { AuthService } from './services/auth';
import ManageCredential from './routes/protected/ManageCredential';
import ManageAlgorand from './routes/protected/ManageAlgorand';
import CreateAlgorand from './routes/protected/CreateAlgorand';
import WalletEnable from './routes/api/WalletEnable';
import WalletTxnConfirmation from './routes/api/WalletTransaction';
import Credentials from './routes/protected/Credentials/Credentials';
import AddCredential from './routes/protected/Credentials/AddCredential';
import CompleteCredential from './routes/protected/Credentials/CompleteCredential';
import AddRecovery from './routes/protected/Credentials/AddRecovery';
import CompleteRecovery from './routes/protected/Credentials/CompleteRecovery';
import AlgorandAccounts from './routes/protected/Algorand/AlgorandAccounts';
import AddAlgorand from './routes/protected/Algorand/AddAlgorand';
import {AlgorandTransactions} from './routes/protected/Algorand/AlgorandTransactions';
import AddAlgorandForm from './routes/protected/Algorand/AddAlgorandForm';
import CompleteAlgorand from './routes/protected/Algorand/CompleteAlgorand';
import AlgorandSuccess from './routes/protected/Algorand/AddAlgorandSuccess';
import { QuickAddAlgorand } from './routes/protected/Algorand/QuickAddAlgorand';
import DappConnections from './routes/protected/Dapp/DappConnections';
import { RekeyAlgorand } from './routes/protected/Algorand/RekeyAlgorand';



function App() {
  const [auth, setAuth] = useState(AuthService.isLoggedIn());
  
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<Navigate replace to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/add_device" element={<AddDevice />} />
        <Route path="/api/enable" element={<WalletEnable />} />
        <Route path="/api/transaction" element={<WalletTxnConfirmation />} />
        <Route path="/" element={<ProtectedRoute />} >
          <Route path="/home" element={<Credentials />} />
          <Route path="/add_credential" element={<AddCredential />} />
          <Route path="/complete_credential" element={<CompleteCredential />} />
          <Route path="/add_recovery" element={<AddRecovery />} />
          <Route path="/complete_recovery" element={<CompleteRecovery />} />

          <Route path="/algorand_accounts" element={<AlgorandAccounts />} />
          <Route path="/algorand_transactions" element={<AlgorandTransactions />} />
          <Route path="/add_algorand_account" element={<AddAlgorand />} />
          <Route path="/add_algorand_account_form" element={<AddAlgorandForm />} />
          <Route path="/complete_algorand_account" element={<CompleteAlgorand />} />
          <Route path="/algorand_account_success" element={<AlgorandSuccess />} />

          <Route path="/dapp_connections" element={<DappConnections />} />

          <Route path="/oldhome" element={<Home />} /> 
          <Route path="/manage_credential" element={<ManageCredential />} />
          <Route path="/manage_algorand" element={<ManageAlgorand />} />
          <Route path="/credential" element={<Credentials />} />
          <Route path="/create_algorand" element={<CreateAlgorand />} />
          <Route path="/quick_add_algorand" element={<QuickAddAlgorand />} />
          <Route path="/rekey_algorand/:address" element={<RekeyAlgorand />} />
        </Route>
        <Route path="*" element={<Navigate replace to="/login" />} />
      </Routes>
    </div>
  );
}

export default App;
