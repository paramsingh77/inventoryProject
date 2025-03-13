import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

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
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setLoading(false);
                return;
            }

            const response = await fetch(`${API_URL}/auth/verify`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error('Invalid server response');
            }

            const data = await response.json();
            
            if (!response.ok) {
                if (response.status === 401) {
                    // Token expired or invalid
                    localStorage.removeItem('token');
                    setUser(null);
                    navigate('/login');
                    throw new Error('Session expired. Please login again.');
                }
                throw new Error(data.message || 'Authentication failed');
            }

            setUser(data.user);
            setError(null);

            // Redirect based on user role
            if (data.user.role === 'admin') {
                navigate('/sites');
            } else {
                navigate('/dashboard');
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            localStorage.removeItem('token');
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const login = async (username, password) => {
        try {
            setLoading(true);
            setError(null);

            // Try to connect to the actual backend
            try {
                const response = await fetch(`${API_URL}/auth/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ username, password }),
                    // Add timeout to prevent hanging
                    timeout: 5000
                });

                const contentType = response.headers.get('content-type');
                if (!contentType || !contentType.includes('application/json')) {
                    throw new Error('Invalid server response');
                }

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || 'Login failed');
                }

                localStorage.setItem('token', data.token);
                setUser(data.user);
                setError(null);
                
                // Redirect based on user role
                if (data.user.role === 'admin') {
                    navigate('/sites');
                } else {
                    navigate('/dashboard');
                }

                return { success: true };
            } catch (error) {
                console.warn('API login failed, using development fallback:', error);
                
                // DEVELOPMENT FALLBACK - remove in production
                if (process.env.NODE_ENV === 'development') {
                    // Check for common test credentials
                    if ((username === 'admin' && password === 'admin123') || 
                        (username === 'user' && password === 'user123')) {
                        
                        // Create mock user and token
                        const role = username === 'admin' ? 'admin' : 'user';
                        const mockToken = 'dev-token-' + Math.random().toString(36).substring(2);
                        const mockUser = {
                            id: username === 'admin' ? 1 : 2,
                            username,
                            email: `${username}@example.com`,
                            role
                        };
                        
                        // Store mock auth data
                        localStorage.setItem('token', mockToken);
                        localStorage.setItem('userRole', role);
                        localStorage.setItem('username', username);
                        
                        setUser(mockUser);
                        
                        // Redirect based on role
                        if (role === 'admin') {
                            navigate('/sites');
                        } else {
                            navigate('/dashboard');
                        }
                        
                        return { success: true };
                    } else {
                        throw new Error('Invalid credentials (dev mode)');
                    }
                } else {
                    // In production, pass through the original error
                    throw error;
                }
            }
        } catch (error) {
            console.error('Login error:', error);
            setError(error.message);
            return { success: false, error: error.message };
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            if (token) {
                const response = await fetch(`${API_URL}/auth/logout`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    throw new Error('Logout failed');
                }
            }
        } catch (error) {
            console.error('Logout error:', error);
            setError(error.message);
        } finally {
            localStorage.removeItem('token');
            setUser(null);
            setLoading(false);
            navigate('/login');
        }
    };

    const value = {
        user,
        loading,
        login,
        logout,
        error,
        setError
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext; 