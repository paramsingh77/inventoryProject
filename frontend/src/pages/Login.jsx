import React, { useState, useEffect } from 'react';
import { Form, Button, Container, Card } from 'react-bootstrap';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import companyLogo from '../images/image copy.png';
import { useAuth } from '../context/AuthContext';
import logo from '../images/image copy.png'
import { checkServerStatus } from '../utils/serverStatus';
import { generateToken } from '../utils/token.js';
const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [networkStatus, setNetworkStatus] = useState('online');
  const [showMockOption, setShowMockOption] = useState(false);

  useEffect(() => {
    const handleOnline = () => setNetworkStatus('online');
    const handleOffline = () => setNetworkStatus('offline');
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Check initial status
    setNetworkStatus(navigator.onLine ? 'online' : 'offline');
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Check server status first
    const isServerAvailable = await checkServerStatus();
    
    if (!isServerAvailable && process.env.NODE_ENV === 'development') {
      console.log('Server is unavailable. Using mock data in development mode.');
      
      // Mock successful login for development testing when server is down
      if (username === 'admin' && password === 'admin123') {
        // Create mock admin user
        const mockUser = {
          id: 1,
          username: 'admin',
          email: 'admin@example.com',
          role: 'admin',
          assigned_site: ''
        };
        
        // Store in localStorage
        localStorage.setItem('token', 'mock-token-for-development');
        localStorage.setItem('userId', mockUser.id);
        localStorage.setItem('username', mockUser.username);
        localStorage.setItem('userEmail', mockUser.email);
        localStorage.setItem('userRole', mockUser.role);
        localStorage.setItem('useMockData', 'true');
        
        // Navigate to sites page

        // here we will add logic to redirect to the OTP page
        const tempToken = generateToken();
        sessionStorage.setItem('tempToken', tempToken);
        navigate(`/authenticate/admin/session/${tempToken}`);


        return;
      } else if (username === 'user' && password === 'user123') {
        // Create mock regular user
        const mockUser = {
          id: 2,
          username: 'user',
          email: 'user@example.com',
          role: 'user',
          assigned_site: 'Dameron Hospital'
        };
        
        // Store in localStorage
        localStorage.setItem('token', 'mock-token-for-development');
        localStorage.setItem('userId', mockUser.id);
        localStorage.setItem('username', mockUser.username);
        localStorage.setItem('userEmail', mockUser.email);
        localStorage.setItem('userRole', mockUser.role);
        localStorage.setItem('assignedSite', mockUser.assigned_site);
        localStorage.setItem('useMockData', 'true');
        
        // Navigate to the user's assigned site
        const tempToken = generateToken();
        sessionStorage.setItem('tempToken', tempToken);
        navigate(`/authenticate/user/session/${tempToken}`);
        return;
      }
      
      setError('Invalid credentials. For development testing use admin/admin123 or user/user123');
      setLoading(false);
      return;
    }

    try {
      console.log('Attempting login with:', username);
      
      // Use the login function from AuthContext
      const result = await login(username, password);
      console.log('Login result:', result);
      
      // Only proceed if login was successful and we have user data
      if (result && result.success && result.user) {
        console.log('Login successful:', result.user);
        
        // Redirect based on role
        if (result.user.role === 'admin') {
          console.log('Admin user detected, redirecting to admin portal');
          const tempToken = generateToken();
          sessionStorage.setItem('tempToken', tempToken);
          navigate(`/authenticate/admin/session/${tempToken}`);
        } else if (result.user.assigned_site) {
          console.log('Regular user detected, redirecting to assigned site');
          const tempToken = generateToken();
          sessionStorage.setItem('tempToken', tempToken);
          navigate(`/authenticate/user/session/${tempToken}`);
        } else {
          setError('Your account does not have an assigned site. Please contact an administrator.');
        }

        // Store user info
        localStorage.setItem('mockUser', JSON.stringify(result.user));
      } else {
        console.error('Login failed:', result);
        setError('Invalid username or password. Please try again.');
      }
    } catch (err) {
      console.error('Login error:', err);
      
      // Add special handling for development mode
      if (process.env.NODE_ENV === 'development') {
        setError(`Login error: ${err.message || 'An unknown error occurred'}. 
          The backend server may not be running. In development mode, you can use mock data.`);
        
        // Add a button to enable mock mode
        setShowMockOption(true);
      } else {
        setError(`Login error: ${err.message || 'An unknown error occurred'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // const renderDevelopmentHelp = () => {
  //   if (process.env.NODE_ENV === 'development') {
  //     return (
  //       <div className="mt-4 p-3 bg-light rounded">
  //         <h6 className="text-muted">Development Mode Credentials:</h6>
  //         <ul className="mb-0 small text-muted">
  //           <li>Admin: username="admin", password="admin123"</li>
  //           <li>User: username="user", password="user123"</li>
  //         </ul>
  //       </div>
  //     );
  //   }
  //   return null;
  // };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <motion.div 
        className="card shadow-lg"
        style={{ maxWidth: '400px', width: '90%' }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="card-body p-5">
          <div className="text-center mb-4">
            <motion.img
              src={logo}
              alt="Logo"
              className="mb-4"
              style={{ height: '60px' }}
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5 }}
            />
            <h2 className="fw-bold text-primary">Welcome Back!</h2>
            <p className="text-muted">Please sign in to continue</p>
          </div>

          {networkStatus === 'offline' && (
            <motion.div 
              className="alert alert-warning"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              You are currently offline. Please check your internet connection.
            </motion.div>
          )}

          {error && (
            <motion.div 
              className="alert alert-danger"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="username" className="form-label">Username</label>
              <motion.input
                type="text"
                className="form-control form-control-lg"
                id="username"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                whileFocus={{ scale: 1.01 }}
              />
            </div>

            <div className="mb-4">
              <label htmlFor="password" className="form-label">Password</label>
              <motion.input
                type="password"
                className="form-control form-control-lg"
                id="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                whileFocus={{ scale: 1.01 }}
              />
            </div>

            <motion.button
              type="submit"
              className="btn btn-primary btn-lg w-100"
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </motion.button>
          </form>

          <div className="mt-4 text-center">
            <small className="text-muted">
              Forgot your password? Contact your administrator
            </small>
          </div>

          {/* {renderDevelopmentHelp()} */}
        </div>
      </motion.div>
    </div>
  );
};

export default Login; 