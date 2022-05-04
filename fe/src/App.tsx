import React, { useState } from 'react';


import { Routes, Route, Link, Navigate } from "react-router-dom";
import './App.css';
import Register from './routes/Register';
import Login from './routes/Login';
import Home from './routes/protected/Home';
import ProtectedRoute from './routes/util/ProtectedRoute';
import { AuthService } from './services/auth';
import ManageCredential from './routes/protected/ManageCredential';
import ManageAlgorand from './routes/protected/ManageAlgorand';
import CreateAlgorand from './routes/protected/CreateAlgorand';
import WalletEnable from './routes/api/WalletEnable';
import WalletTxnConfirmation from './routes/api/WalletTransaction';
import Credentials from './routes/protected/Credentials';
import AddCredential from './routes/protected/AddCredential';
import CompleteCredential from './routes/protected/CompleteCredential';
import AddRecovery from './routes/protected/AddRecovery';
import CompleteRecovery from './routes/protected/CompleteRecovery';
import AlgorandAccounts from './routes/protected/AlgorandAccounts';
import AddAlgorand from './routes/protected/AddAlgorand';
import AddAlgorandForm from './routes/protected/AddAlgorandForm';
import CompleteAlgorand from './routes/protected/CompleteAlgorand';
import AlgorandSuccess from './routes/protected/AddAlgorandSuccess';



function App() {
  const [auth, setAuth] = useState(AuthService.isLoggedIn());
  
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<Navigate replace to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/api/enable" element={<WalletEnable />} />
        <Route path="/api/transaction" element={<WalletTxnConfirmation />} />
        <Route path="/" element={<ProtectedRoute />} >
          <Route path="/home" element={<Credentials />} />
          <Route path="/add_credential" element={<AddCredential />} />
          <Route path="/complete_credential" element={<CompleteCredential />} />
          <Route path="/add_recovery" element={<AddRecovery />} />
          <Route path="/complete_recovery" element={<CompleteRecovery />} />

          <Route path="/algorand_accounts" element={<AlgorandAccounts />} />
          <Route path="/add_algorand_account" element={<AddAlgorand />} />
          <Route path="/add_algorand_account_form" element={<AddAlgorandForm />} />
          <Route path="/complete_algorand_account" element={<CompleteAlgorand />} />
          <Route path="/algorand_account_success" element={<AlgorandSuccess />} />

          <Route path="/oldhome" element={<Home />} /> 
          <Route path="/manage_credential" element={<ManageCredential />} />
          <Route path="/manage_algorand" element={<ManageAlgorand />} />
          <Route path="/credential" element={<Credentials />} />
          <Route path="/create_algorand" element={<CreateAlgorand />} />
        </Route>
        <Route path="*" element={<Navigate replace to="/login" />} />
      </Routes>
    </div>
  );
}

export default App;
