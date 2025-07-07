import { v4 as uuidv4 } from 'uuid';

/**
 * Generates a random token using UUID v4
 * @returns {string} A random UUID
 */
export const generateRandomToken = () => {
  return uuidv4();
};

/**
 * Generates a token with user information - browser compatible
 * @param {Object} userData - User data to encode in the token
 * @returns {string} Token string
 */
export const generateSessionToken = (userData) => {
  // Create a random component
  const randomPart = Math.random().toString(36).substring(2, 10);
  
  // Base64 encode the user data
  const userPart = btoa(JSON.stringify({
    ...userData,
    purpose: 'otp_verification',
    timestamp: Date.now(),
    exp: Date.now() + (15 * 60 * 1000) // 15 minutes expiration
  }));
  
  return `${randomPart}_${userPart}`;
};

/**
 * Verifies and decodes a token
 * @param {string} token - Token to verify
 * @returns {Object|null} Decoded token payload or null if invalid
 */
export const verifySessionToken = (token) => {
  try {
    // Split the token
    const parts = token.split('_');
    if (parts.length !== 2) return null;
    
    // Decode the user data
    const userData = JSON.parse(atob(parts[1]));
    
    // Check if expired
    if (userData.exp < Date.now()) return null;
    
    return userData;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
};

/**
 * Main token generation function for authentication flow
 * @param {Object} userData - User data to encode in the token
 * @returns {string} Token for authentication
 */
export const generateToken = (userData) => {
  return generateSessionToken(userData);
};

export default {
  generateRandomToken,
  generateSessionToken,
  verifySessionToken,
  generateToken
};
