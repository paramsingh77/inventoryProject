import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Container, Form, Button, Alert, Card } from 'react-bootstrap';

const OTPVerification = () => {
  const [otpError, setOtpError] = useState('');
  const [bypassed, setBypassed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [user, setUser] = useState({ email: '' });

  const handleSendOTP = async () => {
    try {
      setLoading(true);
      setOtpError('');
      
      const response = await api.post('/send-otp', { email: user.email });
      
      // Check if we're in development bypass mode
      if (response.data.bypassMode && response.data.otp) {
        console.log('Development mode: OTP bypass activated');
        setBypassed(true);
        setOtp(response.data.otp); // Auto-fill OTP in dev mode
      }
      
      setOtpSent(true);
    } catch (error) {
      console.error('Error sending OTP:', error);
      setOtpError(
        error.response?.data?.error || 
        'Failed to send OTP. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Render your component content here */}
    </div>
  );
};

export default OTPVerification; 