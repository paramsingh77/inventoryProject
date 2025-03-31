/**
 * Utility function to handle logout
 * This can be called from anywhere in the application
 */
export const performLogout = () => {
  console.log('Performing direct logout');
  
  // Clear all localStorage
  localStorage.clear();
  
  // Clear any session storage
  sessionStorage.clear();
  
  // Clear any cookies (optional)
  document.cookie.split(';').forEach(cookie => {
    document.cookie = cookie
      .replace(/^ +/, '')
      .replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`);
  });
  
  // Force a hard redirect to login
  console.log('Redirecting to login page');
  window.location.href = '/login';
}; 