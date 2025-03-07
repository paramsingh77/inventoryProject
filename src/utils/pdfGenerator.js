import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import PODocument from '../components/Orders/PurchaseOrders/PODocument';

export const generatePOPdf = async (poData) => {
  // Create a temporary container
  const temp = document.createElement('div');
  temp.style.position = 'absolute';
  temp.style.left = '-9999px';
  document.body.appendChild(temp);

  // Render the PO document
  const jsx = React.createElement(PODocument, { poData });
  temp.innerHTML = ReactDOMServer.renderToString(jsx);

  try {
    // Convert to canvas
    const canvas = await html2canvas(temp, {
      scale: 2,
      useCORS: true,
      logging: false
    });

    // Generate PDF
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

    // Save the PDF
    pdf.save(`PO-${poData.poNumber}.pdf`);
    return pdf.output('blob');
  } finally {
    // Clean up
    document.body.removeChild(temp);
  }
}; 