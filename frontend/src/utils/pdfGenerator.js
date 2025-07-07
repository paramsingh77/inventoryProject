import React from 'react';
import ReactDOMServer from 'react-dom/server';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import logoImage from '../images/image copy.png'
import PODocument from '../components/Orders/PurchaseOrders/PODocument';
import { preloadLogo } from './imageUtils';

// Load the logo directly as base64
const getBase64Image = async (imgUrl) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = reject;
    img.src = imgUrl;
  });
};

// Generate PDF for Purchase Orders
export const generatePOPdf = async (poData, highQuality = false) => {
  // FIXED: Add diagnostic logging to track productLink data flow
  console.log('🔍 PDF Generator - Received poData:', {
    poNumber: poData.poNumber,
    itemsCount: poData.items?.length || 0,
    itemsWithLinks: poData.items?.map(item => ({
      name: item.name,
      productLink: item.productLink
    })) || []
  });
  
  // TRACKING: Add hardcoded test values for PDF generation
  console.log('🔍 TRACKING - PDF Generator: Full poData received:', JSON.stringify(poData, null, 2));
  
  // Preload the logo to ensure it's in browser cache
  await preloadLogo();
  
  // Create a temporary container
  const temp = document.createElement('div');
  temp.style.position = 'absolute';
  temp.style.left = '-9999px';
  // Set a fixed width to match A4 proportions
  temp.style.width = '794px'; // Roughly A4 width in px at 96 DPI
  document.body.appendChild(temp);

  // Add required fonts and styles to the container
  const fontStyle = document.createElement('style');
  fontStyle.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Helvetica:wght@400;500;600;700&display=swap');
    @import url('https://fonts.googleapis.com/css2?family=Afacad:wght@400;500;600;700&display=swap');
    * {
      font-family: 'Helvetica', 'Afacad', sans-serif !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    @page {
      margin: 0;
      size: A4;
    }
    body {
      margin: 0;
      padding: 0;
    }
    img {
      display: inline-block !important;
    }
  `;
  temp.appendChild(fontStyle);

  // Get the base64 version of the logo
  const logoBase64 = await getBase64Image(logoImage);
  
  // Add logo data to poData
  const enhancedPoData = {
    ...poData,
    logoUrl: logoBase64
  };

  // Render the PO document
  const jsx = React.createElement(PODocument, { poData: enhancedPoData });
  temp.innerHTML = ReactDOMServer.renderToString(jsx);

  try {
    // Give the DOM time to load fonts and render properly
    await new Promise(resolve => setTimeout(resolve, 800));
    
    console.log('Generating PDF canvas...');
    
    // Convert to canvas with quality settings
    const canvas = await html2canvas(temp, {
      scale: highQuality ? 2.5 : 2, // Higher scale for better quality
      useCORS: true,
      logging: false, // Disable logging to reduce console noise
      imageTimeout: 2000, // Longer timeout for images
      backgroundColor: '#ffffff',
      allowTaint: true,
      removeContainer: true,
      letterRendering: true,
      // Improve rendering quality
      onclone: (clonedDoc) => {
        // Force any images to load in the cloned document
        const images = clonedDoc.getElementsByTagName('img');
        for (let i = 0; i < images.length; i++) {
          images[i].setAttribute('crossorigin', 'anonymous');
          
          // If image has base64 data, ensure it's set correctly
          if (logoBase64 && images[i].alt === "AAM Inventory") {
            images[i].src = logoBase64;
          }
        }
      }
    });

    console.log('Canvas generated, dimensions:', canvas.width, 'x', canvas.height);

    // Calculate dimensions with proper aspect ratio
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
      precision: 16 // Higher precision for better rendering
    });
    
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    // Calculate ratio to maintain aspect ratio
    const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
    const imgWidthMM = imgWidth * ratio;
    const imgHeightMM = imgHeight * ratio;
    
    // Center the image on the page
    const xPos = (pdfWidth - imgWidthMM) / 2;
    const yPos = 0; // Align to top to maximize space
    
    // Use compression options if available
    if (pdf.setCompression) {
      pdf.setCompression(true);
    }
    
    console.log('Converting canvas to image data...');
    
    // Use higher quality JPEG for the export
    const imgQuality = highQuality ? 0.98 : 0.9;
    const imgData = canvas.toDataURL('image/jpeg', imgQuality);
    
    console.log('Image data generated, size:', imgData.length, 'bytes');
    
    // Add image to PDF with proper dimensions and positioning
    pdf.addImage(imgData, 'JPEG', xPos, yPos, imgWidthMM, imgHeightMM, undefined, 'FAST');

    console.log('PDF creation completed, getting output...');
    
    // Get the PDF output as an ArrayBuffer for more consistent handling
    const pdfArrayBuffer = pdf.output('arraybuffer');
    
    // Create a blob with the correct PDF MIME type
    const pdfBlob = new Blob([pdfArrayBuffer], { type: 'application/pdf' });
    
    console.log('PDF blob created, size:', pdfBlob.size, 'bytes');
    
    // Return the blob or save the PDF
    if (highQuality) {
      // Check if the PDF is valid by trying to read a small part of it
      try {
        const testReader = new FileReader();
        const testPromise = new Promise((resolve, reject) => {
          testReader.onload = () => resolve(true);
          testReader.onerror = () => reject(new Error('Generated PDF validation failed'));
          testReader.readAsArrayBuffer(pdfBlob.slice(0, 5000)); // Read just the beginning to validate
        });
        
        await testPromise;
        console.log('Generated valid PDF', pdfBlob.size, 'bytes');
        return pdfBlob;
      } catch (validationError) {
        console.error('PDF validation failed, retrying with lower quality:', validationError);
        // If validation fails, try again with lower quality
        return generatePOPdf(poData, false);
      }
    } else {
      // For download use case
      pdf.save(`PO-${poData.poNumber}.pdf`);
      return true;
    }
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    // Fallback to a simple PDF if html2canvas fails
    try {
      const fallbackPdf = new jsPDF();
      fallbackPdf.text(`Purchase Order: ${poData.poNumber}`, 20, 20);
      fallbackPdf.text(`Vendor: ${poData.vendor?.name || 'N/A'}`, 20, 30);
      fallbackPdf.text(`Date: ${new Date().toLocaleDateString()}`, 20, 40);
      fallbackPdf.text(`Amount: $${poData.totalAmount || 0}`, 20, 50);
      fallbackPdf.text('This is a simplified fallback version due to rendering issues.', 20, 70);
      
      const fallbackBlob = new Blob([fallbackPdf.output('arraybuffer')], { type: 'application/pdf' });
      return fallbackBlob;
    } catch (fallbackError) {
      console.error('Even fallback PDF generation failed:', fallbackError);
      throw error; // Throw the original error
    }
  } finally {
    // Clean up
    if (document.body.contains(temp)) {
      document.body.removeChild(temp);
    }
  }
};

// Function to check PDF size and regenerate with lower quality if needed
export const generateOptimizedPOPdf = async (poData) => {
  // First try with high quality
  const highQualityPdf = await generatePOPdf(poData, true);
  
  // If the PDF is under 10MB, return it
  if (highQualityPdf.size < 10 * 1024 * 1024) {
    return highQualityPdf;
  }
  
  console.log(`High quality PDF is too large (${(highQualityPdf.size / (1024 * 1024)).toFixed(2)}MB), generating lower quality version...`);
  
  // If it's too large, regenerate with lower quality
  return generatePOPdf(poData, false);
}; 