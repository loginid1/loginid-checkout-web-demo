import React, { useEffect, useState } from 'react';

import { Routes, Route, Link, Navigate } from "react-router-dom";
import './AuthDemo.css';
import { FederatedSDK } from './lib/FederatedSDK';
import Pricing from './Pricing'



	const wallet = new FederatedSDK(process.env.REACT_APP_VAULT_URL || "");
export  function AuthDemo() {
  useEffect(()=>{
    console.log("origin: ",window.location.origin);
    checkSession();
  })

  async function checkSession () {
    let iFrame = document.getElementById("vault-iframe-auth");
    if (iFrame !=null && iFrame instanceof HTMLIFrameElement && iFrame.contentWindow != null) {
        console.log("signup");
        await wallet.signUp(iFrame.contentWindow);
    }
  }
  function hideModel(){
     const modal = document.getElementById('modal-form');
     if (modal != null ) {
      modal.style.display = 'none';
     }


  } 
  return (
    <div  >
     <Pricing/> 
<div id="modal-form" className="modal-issue">

	<div className="modal-content">
		<div className="modal-header">
			<span className="close" onClick={hideModel}>&times;</span>

		</div>
		<div className="modal-body">
			<iframe id="vault-iframe-auth" className="airtable-embed" src="http://localhost:3000/fe/api/auth" allow="publickey-credentials-get *; " width="100%" height="320" style={{border:'none'}} ></iframe>
		</div>
	</div>
</div>


    </div>
  );
}

