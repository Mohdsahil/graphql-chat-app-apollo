import React from 'react';
import { Navigate } from 'react-router-dom';

const AuthRoute = ({ children }) => {
  const token = localStorage.getItem('token');

  if (token) {
    // If the user is logged in, redirect to the homepage or another page
    return <Navigate to="/" />;
  }

  // If the user is not authenticated, render the child component (login/register)
  return children;
};

export default AuthRoute;
