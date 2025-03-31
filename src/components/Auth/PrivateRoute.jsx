import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const PrivateRoute = ({ children }) => {
    const { user, loading } = useAuth();
    const location = useLocation();
    
    console.log('PrivateRoute - User:', user);
    console.log('PrivateRoute - Current location:', location.pathname);

    const token = localStorage.getItem('token');
    const isAuthenticated = !!token;

    // Add token refresh logic if needed
    const refreshToken = async () => {
        try {
            const response = await fetch('/api/auth/refresh', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                localStorage.setItem('token', data.token);
                return true;
            }
        } catch (error) {
            console.error('Token refresh failed:', error);
        }
        return false;
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        console.log('No user found, redirecting to login');
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    console.log('User authenticated, rendering outlet');
    return <Outlet />;
};

export default PrivateRoute; 