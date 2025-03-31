import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const AuthContext = createContext(null);
const API_URL = 'http://localhost:2000/api';

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const checkLoggedIn = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem('token');
                
                if (!token) {
                    console.log('No token found in localStorage');
                    setUser(null);
                    setLoading(false);
                    return;
                }
                
                // Create user object from localStorage
                const userId = localStorage.getItem('userId');
                const username = localStorage.getItem('username');
                const userEmail = localStorage.getItem('userEmail');
                const userRole = localStorage.getItem('userRole');
                const assignedSite = localStorage.getItem('assignedSite');
                
                if (userId && username && userRole) {
                    const userData = {
                        id: userId,
                        username,
                        email: userEmail || '',
                        role: userRole,
                        assigned_site: assignedSite || ''
                    };
                    
                    console.log('User restored from localStorage:', userData);
                    setUser(userData);
                } else {
                    console.log('Incomplete user data in localStorage');
                    setUser(null);
                }
                
                setLoading(false);
            } catch (error) {
                console.error('Error checking login status:', error);
                setUser(null);
                setLoading(false);
            }
        };
        
        checkLoggedIn();
    }, []);

    const login = async (username, password) => {
        try {
            setLoading(true);
            setError(null);
            
            // Use a try-catch with proper error handling
            try {
                const response = await fetch('http://localhost:2000/api/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ username, password })
                });
                
                // Check if the response is JSON
                const contentType = response.headers.get('content-type');
                if (!contentType || !contentType.includes('application/json')) {
                    throw new Error('Server returned non-JSON response. The server may be misconfigured.');
                }
                
                const data = await response.json();
                
                if (!response.ok) {
                    throw new Error(data.error || `Server error: ${response.status}`);
                }
                
                // Store token and user data
                localStorage.setItem('token', data.token);
                localStorage.setItem('userId', data.user.id);
                localStorage.setItem('username', data.user.username);
                localStorage.setItem('userEmail', data.user.email || '');
                localStorage.setItem('userRole', data.user.role);
                localStorage.setItem('assignedSite', data.user.assigned_site || '');
                
                // Set user in state
                setUser({
                    id: data.user.id,
                    username: data.user.username,
                    email: data.user.email,
                    role: data.user.role,
                    assigned_site: data.user.assigned_site
                });
                
                return data;
            } catch (fetchError) {
                // Check if this is a network error (server down)
                if (fetchError.message && fetchError.message.includes('NetworkError')) {
                    throw new Error('Cannot connect to the server. Please try again later.');
                }
                // Check if this is a CORS error
                if (fetchError.message && fetchError.message.includes('CORS')) {
                    throw new Error('Cross-origin request blocked. Please check server configuration.');
                }
                
                throw fetchError;
            }
        } catch (error) {
            console.error('Login error:', error);
            setError(error.message || 'Failed to login');
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        try {
            console.log('AuthContext: Logging out user');
            
            // Clear user data
            setUser(null);
            
            // Clear token from localStorage
            localStorage.removeItem('token');
            
            // Clear any other auth-related data
            localStorage.removeItem('user');
            localStorage.removeItem('userRole');
            localStorage.removeItem('userId');
            localStorage.removeItem('username');
            localStorage.removeItem('userEmail');
            localStorage.removeItem('lastSelectedSite');
            
            console.log('AuthContext: User logged out successfully');
            return true;
        } catch (error) {
            console.error('AuthContext: Error during logout:', error);
            throw error;
        }
    };

    const checkSiteAccess = (siteName) => {
        if (!user) return false;
        if (user.role === 'admin') return true;
        return user.assigned_site === siteName;
    };

    const directLogout = () => {
        // Clear all auth state
        setUser(null);
        
        // Clear all localStorage
        localStorage.clear();
        
        // Force a hard redirect to login
        window.location.href = '/login';
    };

    const value = {
        user,
        loading,
        login,
        logout,
        directLogout,
        error,
        setError,
        checkSiteAccess
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext; 