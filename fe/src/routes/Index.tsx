import React from 'react';
import {  Navigate  } from 'react-router-dom';
import { AuthService } from '../services/auth';

export default function Index()  {
    
    const auth = AuthService.isLoggedIn();

    let redirect_url = "/login";
    if (auth) {
        redirect_url = "/home";
    }
    return  <Navigate to={redirect_url} />;
}
