import { Routes, Route, Link, Navigate, Router } from "react-router-dom";
import "./App.css";
import Login from "./routes/Login";
import { FidoVaultSDK } from "./lib/LoginidVaultSDK";
import { Register } from "./routes/Register";
import React, { useState } from "react";
import { AuthService } from "./services/auth";

export default function App() {
  const [auth, setAuth] = useState(AuthService.isLoggedIn());
  
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<Navigate replace to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<Navigate replace to="/login" />} />
      </Routes>
    </div>
  );
}
