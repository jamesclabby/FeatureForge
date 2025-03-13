import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

/**
 * ProtectedRoute component that redirects unauthenticated users to the login page
 * This component is used to protect routes that require authentication
 */
const ProtectedRoute = () => {
  const { currentUser, loading } = useAuth();
  const location = useLocation();

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        <p className="ml-4 text-gray-600">Loading...</p>
      </div>
    );
  }

  // If user is not authenticated, redirect to login page with the return URL
  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If user is authenticated, render the child routes
  return <Outlet />;
};

export default ProtectedRoute; 