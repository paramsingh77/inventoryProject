import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import PODocument from '../components/Orders/PurchaseOrders/PODocument';

// Optimize PDF generation with lower quality settings
export const generatePOPdf = async (poData, highQuality = false) => {
  // Create a temporary container
  const temp = document.createElement('div');
  temp.style.position = 'absolute';
  temp.style.left = '-9999px';
  document.body.appendChild(temp);

  // Render the PO document
  const jsx = React.createElement(PODocument, { poData });
  temp.innerHTML = ReactDOMServer.renderToString(jsx);

  try {
    // Convert to canvas with quality settings
    const canvas = await html2canvas(temp, {
      scale: highQuality ? 2 : 1.5, // Lower scale for smaller file size
      useCORS: true,
      logging: false,
      imageTimeout: 0, // No timeout
      // Lower quality settings
      backgroundColor: '#ffffff',
      allowTaint: true,
      removeContainer: true
    });

    // Generate PDF with compression settings
    const imgData = canvas.toDataURL('image/jpeg', highQuality ? 1.0 : 0.7); // Use JPEG instead of PNG for smaller size
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    // Use compression options if available
    if (pdf.setCompression) {
      pdf.setCompression(true);
    }
    
    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);

    // Save the PDF
    pdf.save(`PO-${poData.poNumber}.pdf`);
    return pdf.output('blob');
  } finally {
    // Clean up
    document.body.removeChild(temp);
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