import React, { useState } from 'react';


import { Routes, Route, Link, Navigate } from "react-router-dom";
import './App.css';
import DemoApp from './DemoApp';
import {AuthDemo} from './AuthDemo';
import Dashboard from './components/dashboard/Dashboard';



function App() {
  
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<DemoApp />} />
        <Route path="/auth" element={<AuthDemo />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </div>
  );
}

export default App;
