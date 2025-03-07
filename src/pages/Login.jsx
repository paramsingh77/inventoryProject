import React, { useState } from 'react';
import { Form, Button, Container, Card } from 'react-bootstrap';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import companyLogo from '../images/image copy.png';
import { useAuth } from '../context/AuthContext';
import logo from '../images/image copy.png'

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(username, password);
      if (!result.success) {
        setError(result.error || 'Invalid credentials');
      }
      else{
        navigate('/sites');
      }
    } catch (err) {
      setError('An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

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
        </div>
      </motion.div>
    </div>
  );
};

export default Login; 