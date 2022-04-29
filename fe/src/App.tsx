import React, { useState } from "react";

import { Routes, Route, Link, Navigate, Router } from "react-router-dom";
import "./App.css";
import {Register} from "./routes/Register";
import Login from "./routes/Login";
import Home from "./routes/protected/Home";
import ProtectedRoute from "./routes/util/ProtectedRoute";
import { AuthService } from "./services/auth";
import ManageCredential from "./routes/protected/ManageCredential";
import ManageAlgorand from "./routes/protected/ManageAlgorand";
import CreateAlgorand from "./routes/protected/CreateAlgorand";
import AlgoTransaction from "./routes/api/WalletTransaction";
import WalletEnable from "./routes/api/WalletEnable";
import Credentials from "./routes/protected/Credentials";

function App() {
  const [auth, setAuth] = useState(AuthService.isLoggedIn());
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<Navigate replace to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/enable" element={<WalletEnable />} />
        <Route path="/home" element={<Credentials />} />
        <Route path="/" element={<ProtectedRoute />}>
          <Route path="/manage_credential" element={<ManageCredential />} />
          <Route path="/manage_algorand" element={<ManageAlgorand />} />
          <Route path="/create_algorand" element={<CreateAlgorand />} />
          <Route path="/tx/connect" element={<AlgoTransaction />} />
          <Route path="/tx/confirm" element={<AlgoTransaction />} />
        </Route>
        <Route path="*" element={<Navigate replace to="/login" />} />
      </Routes>
    </div>
  );
}

export default App;
