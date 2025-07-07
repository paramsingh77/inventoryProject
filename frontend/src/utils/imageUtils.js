/**
 * Utility functions for handling images
 */

import logoImage from '../images/image copy.png';

// Create a public version of the logo
export const createPublicLogoUrl = () => {
  try {
    // Create a blob URL from the imported image
    const img = new Image();
    img.src = logoImage;
    
    // When image loads, create a canvas and draw the image
    return new Promise((resolve) => {
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        
        // Convert canvas to blob and create a URL
        canvas.toBlob((blob) => {
          const url = URL.createObjectURL(blob);
          resolve(url);
        }, 'image/png');
      };
      
      // In case of error, resolve with the original logo path
      img.onerror = () => {
        console.error('Error creating public logo URL');
        resolve(logoImage);
      };
    });
  } catch (error) {
    console.error('Error in createPublicLogoUrl:', error);
    return Promise.resolve(logoImage);
  }
};

// Preload the logo image to ensure it's available for PDF generation
export const preloadLogo = async () => {
  try {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = logoImage;
    
    // Add a timeout to prevent hanging if image doesn't load
    const imageLoaded = new Promise((resolve) => {
      img.onload = () => {
        console.log('Logo preloaded successfully');
        resolve(true);
      };
      img.onerror = () => {
        console.error('Failed to preload logo');
        resolve(false);
      };
    });
    
    // Set a timeout of 2 seconds for loading
    const timeout = new Promise(resolve => {
      setTimeout(() => {
        console.log('Logo preload timed out');
        resolve(false);
      }, 2000);
    });
    
    // Return the result of whichever completes first
    return Promise.race([imageLoaded, timeout]);
    
  } catch (error) {
    console.error('Error in preloadLogo:', error);
    return false;
  }
}; 