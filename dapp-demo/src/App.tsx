import React from 'react';
import logo from './logo.svg';
import './App.css';
import { FidoVaultSDK } from './lib/LoginidVaultSDK';

function App() {

  function handleEnableClick(){
    FidoVaultSDK.enable({network:"sandnet"});
  }
  return (
    <div className="App">
      <header className="App-header">
        <p>
          Edit <code>src/App.tsx</code> and save to reload.
        </p>
        <a
          className="App-link"
          onClick={handleEnableClick}
          target="_blank"
          rel="noopener noreferrer"
        >
          Test Enable
        </a>
      </header>
    </div>
  );
}

export default App;
