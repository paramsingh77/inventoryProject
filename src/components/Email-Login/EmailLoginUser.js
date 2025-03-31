import React, { useState, useEffect } from 'react';
import axios from 'axios';
import OtpInput from './OtpInput';
import { useNavigate, useParams } from 'react-router-dom';
import { verifySessionToken } from '../../utils/token';

const EmailLoginUser= () => {
    const [email, setEmail] = useState('');
    const [showOtpInput, setShowOtpInput] = useState(false);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [userData, setUserData] = useState(null);
    const navigate = useNavigate();
    const { token } = useParams();

    useEffect(() => {
        // Add debugging
        console.log('EmailLoginAdmin mounted, token:', token);
        console.log('localStorage mockUser:', localStorage.getItem('mockUser'));
        
        // Try to get user data from token parameter first
        if (token) {
            const decodedToken = verifySessionToken(token);
            console.log('Decoded token:', decodedToken);
            if (decodedToken && decodedToken.email) {
                setEmail(decodedToken.email);
                setUserData(decodedToken);
                sendOtp(decodedToken.email);
                return;
            }
        }

        // Fallback to localStorage if no valid token
        const storedUser = JSON.parse(localStorage.getItem('mockUser') || '{}');
        console.log('Parsed stored user:', storedUser);
        
        if (storedUser && storedUser.email) {
            setEmail(storedUser.email);
            setUserData(storedUser);
            sendOtp(storedUser.email);
        } else {
            setLoading(false); // Stop loading
            setMessage('No user email found. Please enter your email manually.');
            // Don't automatically redirect
        }
    }, [navigate, token]);

    const sendOtp = async (emailAddress) => {
        setLoading(true);
        try {
            const response = await axios.post('http://localhost:2000/api/send-otp', { 
                email: emailAddress 
            });
            
            setShowOtpInput(true);
            setMessage(`OTP sent to ${emailAddress}. Please check your inbox.`);
        } catch (error) {
            console.error('Error sending OTP:', error);
            setMessage(`Error sending OTP: ${error.response?.data?.error || error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const onOtpSubmit = async (otp) => {
        try {
            setLoading(true);
            const response = await axios.post('http://localhost:2000/api/verify-otp', { 
                email,
                otp: otp.toString()
            });

            setMessage("OTP verified successfully! Redirecting...");
            
            // Store authentication state if needed
            if (userData) {
                localStorage.setItem('authenticated', 'true');
                localStorage.setItem('user', JSON.stringify(userData));
            }
            
            // Navigate to the appropriate route based on user role
            setTimeout(() => {
                navigate(`/sites/${encodeURIComponent(userData.assigned_site)}`);
            }, 1500);
        } catch (error) {
            console.error('Error verifying OTP:', error.response?.data || error.message);
            setMessage(error.response?.data?.error || "Invalid OTP. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mt-5">
            <div className="row justify-content-center">
                <div className="col-md-6">
                    <div className="card shadow">
                        <div className="card-header bg-primary text-white">
                            <h3 className="mb-0">Email Verification</h3>
                        </div>
                        <div className="card-body">
                            {loading ? (
                                <div className="text-center py-4">
                                    <div className="spinner-border text-primary" role="status">
                                        <span className="visually-hidden">Loading...</span>
                                    </div>
                                    <p className="mt-2">Processing...</p>
                                </div>
                            ) : (
                                <>
                                    {email ? (
                                        <div className="text-center mb-4">
                                            <p className="lead">Verification code sent to:</p>
                                            <h5 className="text-primary">{email}</h5>
                                        </div>
                                    ) : (
                                        <div className="alert alert-danger">No email address found</div>
                                    )}

                                    {showOtpInput && (
                                        <div className="text-center">
                                            <p>Enter the 4-digit code:</p>
                                            <div className="d-flex justify-content-center gap-2 mb-3">
                                                <OtpInput otpLength={4} onOtpSubmit={onOtpSubmit} />
                                            </div>
                                            <button 
                                                className="btn btn-outline-secondary mt-3"
                                                onClick={() => sendOtp(email)}
                                            >
                                                Resend Code
                                            </button>
                                        </div>
                                    )}

                                    {!email && !loading && (
                                        <div className="manual-entry mt-3">
                                            <h5>Enter your email address</h5>
                                            <div className="mb-3">
                                                <input
                                                    type="email"
                                                    className="form-control"
                                                    placeholder="Your email address"
                                                    onChange={(e) => setEmail(e.target.value)}
                                                />
                                            </div>
                                            <button 
                                                className="btn btn-primary" 
                                                onClick={() => {
                                                    if (email && /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i.test(email)) {
                                                        sendOtp(email);
                                                    } else {
                                                        setMessage('Please enter a valid email address');
                                                    }
                                                }}
                                            >
                                                Send Verification Code
                                            </button>
                                        </div>
                                    )}

                                    {message && (
                                        <div className={`alert ${message.includes('Error') ? 'alert-danger' : 'alert-info'} mt-3`}>
                                            {message}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmailLoginUser;



