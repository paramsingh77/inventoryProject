import React, { useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Spinner } from 'react-bootstrap';

const Logout = () => {
    const { logout } = useAuth();

    useEffect(() => {
        const performLogout = async () => {
            try {
                console.log('Logging out...');
                
                // First clear all localStorage items directly
                localStorage.clear();
                
                // Then call the logout function
                await logout();
                
                console.log('Logout successful, redirecting to login page');
            } catch (error) {
                console.error('Logout error:', error);
            } finally {
                // Always redirect to login page, regardless of success/failure
                console.log('Forcing redirect to login page');
                
                // Use setTimeout to ensure this happens after React updates
                setTimeout(() => {
                    // Use window.location for a hard redirect
                    window.location.replace('/login');
                }, 100);
            }
        };

        performLogout();
    }, [logout]);

    return (
        <div className="d-flex justify-content-center align-items-center vh-100">
            <div className="text-center">
                <Spinner animation="border" role="status" variant="primary" className="mb-3">
                    <span className="visually-hidden">Logging out...</span>
                </Spinner>
                <h3>Logging out...</h3>
                <p className="text-muted">You will be redirected to the login page shortly.</p>
            </div>
        </div>
    );
};

export default Logout; 