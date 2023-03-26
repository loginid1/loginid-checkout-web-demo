import React, { useState } from 'react';


import { Routes, Route, Link, Navigate } from "react-router-dom";
import './App.css';
import DemoApp from './DemoApp';
import {AuthDemo} from './AuthDemo';



function App() {
  
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<DemoApp />} />
        <Route path="/auth" element={<AuthDemo />} />
      </Routes>
    </div>
  );
}

export default App;
