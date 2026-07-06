import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

/**
 * PrivateRoute — wraps any route that requires authentication.
 * Checks localStorage for a valid token (mirrors api.js lookup order).
 * Unauthenticated users are redirected to /login with the originally
 * requested path saved in location state so LoginPage can redirect back.
 */
const PrivateRoute = ({ children }) => {
  const location = useLocation();
  const token =
    localStorage.getItem('access_token') ||
    localStorage.getItem('token') ||
    localStorage.getItem('access');

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default PrivateRoute;
