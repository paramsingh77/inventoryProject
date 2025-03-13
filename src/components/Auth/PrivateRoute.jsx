import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const PrivateRoute = () => {
    const { user, loading } = useAuth();
    const [isDevelopmentBypass, setIsDevelopmentBypass] = useState(false);

    // For development mode only - check local storage directly as a fallback
    useEffect(() => {
        if (process.env.NODE_ENV === 'development' && !user) {
            const hasToken = localStorage.getItem('token');
            const hasUserRole = localStorage.getItem('userRole');
            
            if (hasToken && hasUserRole) {
                console.log('Development mode: Using localStorage auth data');
                setIsDevelopmentBypass(true);
            }
        }
    }, [user]);

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    // Allow access if we have a user OR we're in development mode with a token
    return (user || isDevelopmentBypass) ? <Outlet /> : <Navigate to="/login" />;
};

export default PrivateRoute; 