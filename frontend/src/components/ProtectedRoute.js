import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');

  if (!token) {
    // If the user is not logged in, redirect to login page
    return <Navigate to="/login" />;
  }

  // If the user is authenticated, render the child component (protected page)
  return children;
};

export default ProtectedRoute;
