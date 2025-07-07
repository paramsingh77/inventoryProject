import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import axios from 'axios';

const AuthContext = createContext(null);

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
    const [authenticated, setAuthenticated] = useState(false);
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
            
            console.log('AuthContext: Attempting login with:', username);
            
            const response = await api.post('/auth/login', {
                email: username,
                password
            });
            
            console.log('AuthContext: Login API response:', response.data);
            
            if (response.data.success && response.data.user) {
                // Store token and user data
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('user', JSON.stringify(response.data.user));
                localStorage.setItem('userId', response.data.user.id);
                localStorage.setItem('username', response.data.user.username);
                localStorage.setItem('userEmail', response.data.user.email || '');
                localStorage.setItem('userRole', response.data.user.role);
                localStorage.setItem('assignedSite', response.data.user.assigned_site || '');
                
                // Update state
                setUser(response.data.user);
                setAuthenticated(true);
                
                // Return the full response data
                return {
                    success: true,
                    user: response.data.user
                };
            } else {
                setError(response.data.message || 'Login failed');
                return {
                    success: false,
                    message: response.data.message || 'Login failed'
                };
            }
        } catch (err) {
            console.error('AuthContext: Login error:', err);
            setError(
                err.response?.data?.message || 
                'Server error. Please try again later.'
            );
            return {
                success: false,
                message: err.response?.data?.message || 'Server error during login'
            };
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
        checkSiteAccess,
        authenticated,
        setAuthenticated
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext; 