import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  console.log('ProtectedRoute - User:', user);
  console.log('ProtectedRoute - Required role:', requiredRole);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If role is required and user doesn't have it, redirect to appropriate page
  if (requiredRole && user.role !== requiredRole) {
    console.log(`User role ${user.role} does not match required role ${requiredRole}`);
    
    if (user.role === 'admin') {
      return <Navigate to="/sites" replace />;
    } else if (user.assigned_site) {
      return <Navigate to={`/sites/${encodeURIComponent(user.assigned_site)}`} replace />;
    } else {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  // If authenticated and has required role (or no role required), render children
  return children;
};

export default ProtectedRoute; 