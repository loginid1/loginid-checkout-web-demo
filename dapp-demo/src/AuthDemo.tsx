import React, { useState } from 'react';

import { Routes, Route, Link, Navigate } from "react-router-dom";
import './AuthDemo.css';
import Pricing from './Pricing'



export  function AuthDemo() {
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
			<iframe className="airtable-embed" src="http://localhost:3000/fe/api/auth" allow="publickey-credentials-get *; " width="100%" height="320" style={{border:'none'}} ></iframe>
		</div>
	</div>
</div>


    </div>
  );
}

