import React from 'react';
import { Route, Navigate, Outlet } from 'react-router-dom';
import { AuthService } from '../../services/auth';

const ProtectedRoute = () =>  {
    
    const auth = AuthService.isLoggedIn();

    const redirect_url = "/login?redirect_error="+ encodeURIComponent("not authorized - please login again!")
    return auth ? <Outlet />: <Navigate to={redirect_url} />;
}

export default ProtectedRoute;