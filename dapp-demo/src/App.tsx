import React, { useState } from 'react';


import { Routes, Route, Link, Navigate } from "react-router-dom";
import './App.css';
import DemoApp from './DemoApp';
import {AuthDemo} from './AuthDemo';
import Dashboard from './components/dashboard/Dashboard';
import { OidcCallback } from './OidcCallback';



function App() {
  
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<AuthDemo />} />
        <Route path="/algo" element={<DemoApp />} />
        <Route path="/auth" element={<AuthDemo />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/callback" element={<OidcCallback />} />
      </Routes>
    </div>
  );
}

export default App;
