import React, { useState } from 'react';


import { Routes, Route, Link, Navigate } from "react-router-dom";
import './App.css';
// import "@microblink/blinkid-in-browser-sdk/ui";
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
import AddRecovery from './routes/protected/Algorand/AddRecovery';
import CompleteRecovery from './routes/protected/Algorand/CompleteRecovery';
import AlgorandAccounts from './routes/protected/Algorand/AlgorandAccounts';
import AddAlgorand from './routes/protected/Algorand/AddAlgorand';
import {AlgorandTransactions} from './routes/protected/Algorand/AlgorandTransactions';
import AddAlgorandForm from './routes/protected/Algorand/AddAlgorandForm';
import CompleteAlgorand from './routes/protected/Algorand/CompleteAlgorand';
import AlgorandSuccess from './routes/protected/Algorand/AddAlgorandSuccess';
import { QuickAddAlgorand } from './routes/protected/Algorand/QuickAddAlgorand';
import DappConnections from './routes/protected/Dapp/DappConnections';
import { RekeyAlgorand } from './routes/protected/Algorand/RekeyAlgorand';
import { SendwyreSDK } from './lib/VaultSDK/sendwyre';
import { SendWyreOrder } from './routes/protected/Algorand/SendWyreOrder';
import { SendWyreCallback } from './routes/protected/Algorand/SendWyreCallback';
import Passes, { NewPass } from './routes/protected/Passes';
import Index from './routes/Index';
import { Faq } from './routes/Faq';
import { Help } from './routes/protected/Help';
import WalletLogin from './routes/api/FederatedAuth';
import FederatedAuth from './routes/api/FederatedAuth';
import FederatedRegister from './routes/api/FederatedRegister';
import EmailValidation from './routes/api/EmailValidation';
import DeveloperConsole from './routes/protected/Developer/Console';
import CreateApp from './routes/protected/Developer/CreateApp';
import UpdateApp from './routes/protected/Developer/UpdateApp';
import FederatedAuthPopup from './routes/api/FederatedAuthPopup';
import AlgorandRecovery from './routes/protected/Algorand/AlgorandRecovery';



function App() {
  const [auth, setAuth] = useState(AuthService.isLoggedIn());
  
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/faq" element={<Faq />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/:entry/login" element={<Login />} />
        <Route path="/:entry/register" element={<Register />} />
        <Route path="/sdk/auth_p" element={<FederatedAuthPopup />} />
        <Route path="/sdk/auth" element={<FederatedAuth />} />
        <Route path="/sdk/register" element={<FederatedRegister />} />
        <Route path="/sdk/email" element={<EmailValidation />} />
        <Route path="/add_device" element={<AddDevice />} />
        <Route path="/add" element={<AddDevice />} />
        <Route path="/sdk/enable" element={<WalletEnable />} />
        <Route path="/sdk/enable/:data" element={<WalletEnable />} />
        <Route path="/sdk/transaction" element={<WalletTxnConfirmation />} />
        <Route path="/" element={<ProtectedRoute />} >
          <Route path="/help" element={<Help />} />
          <Route path="/home" element={<Credentials />} />
          <Route path="/home/algo" element={<AlgorandAccounts />} />
          <Route path="/add_credential" element={<AddCredential />} />
          <Route path="/complete_credential" element={<CompleteCredential />} />

          <Route path="/algorand/accounts" element={<AlgorandAccounts />} />
          <Route path="/algorand/recovery" element={<AlgorandRecovery />} />
          <Route path="/add_recovery" element={<AddRecovery />} />
          <Route path="/complete_recovery" element={<CompleteRecovery />} />
          <Route path="/algorand_transactions" element={<AlgorandTransactions />} />
          <Route path="/add_algorand_account" element={<AddAlgorand />} />
          <Route path="/add_algorand_account_form" element={<AddAlgorandForm />} />
          <Route path="/complete_algorand_account" element={<CompleteAlgorand />} />
          <Route path="/algorand_account_success" element={<AlgorandSuccess />} />

          <Route path="/algorand/dapps" element={<DappConnections />} />

          <Route path="/oldhome" element={<Home />} /> 
          <Route path="/passes" element={<Passes />} /> 
          <Route path="/passes/new" element={<NewPass />} /> 
          <Route path="/manage_credential" element={<ManageCredential />} />
          <Route path="/manage_algorand" element={<ManageAlgorand />} />
          <Route path="/credential" element={<Credentials />} />
          <Route path="/create_algorand" element={<CreateAlgorand />} />
          <Route path="/quick_add_algorand" element={<QuickAddAlgorand />} />
          <Route path="/rekey_algorand/:address" element={<RekeyAlgorand />} />
          <Route path="/algo/order/:address" element={<SendWyreOrder />} />
          <Route path="/sendwyre/callback" element={<SendWyreCallback />} />
          <Route path="/developer/console" element={<DeveloperConsole />} />
          <Route path="/developer/createApp" element={<CreateApp />} />
          <Route path="/developer/updateApp" element={<UpdateApp />} />
        </Route>
        <Route path="*" element={<Navigate replace to="/login" />} />
      </Routes>
    </div>
  );
}

export default App;
