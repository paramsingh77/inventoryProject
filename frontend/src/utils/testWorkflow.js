/**
 * Test Workflow Utility
 * 
 * This script simulates the Purchase Order and Invoice workflow
 * for testing purposes.
 */

// Simulate creating a new Purchase Order
export const simulateNewPO = (poData) => {
  const defaultPO = {
    poNumber: `PO-${Date.now()}`,
    vendor: {
      name: 'Test Vendor',
      email: 'vendor@example.com'
    },
    createdAt: new Date().toISOString(),
    totalAmount: 1500.00,
    status: 'Pending',
    hasInvoice: false
  };

  const po = { ...defaultPO, ...poData };

  // Dispatch event to update PO list
  const poEvent = new CustomEvent('purchaseOrder', {
    detail: {
      type: 'NEW_PO',
      po
    }
  });
  
  window.dispatchEvent(poEvent);
  console.log('Simulated new PO:', po);
  
  return po;
};

// Simulate receiving an invoice for a PO
export const simulateNewInvoice = (poReference, invoiceData) => {
  const defaultInvoice = {
    invoiceNumber: `INV-${Date.now()}`,
    vendorName: 'Test Vendor',
    vendor: {
      name: 'Test Vendor',
      email: 'vendor@example.com'
    },
    receivedDate: new Date().toISOString(),
    poReference,
    status: 'Received',
    amount: 1500.00,
    filename: `Invoice_${poReference}_${Date.now()}.pdf`
  };

  const invoice = { ...defaultInvoice, ...invoiceData };

  // Dispatch event to update invoice list and PO status
  const invoiceEvent = new CustomEvent('invoice', {
    detail: {
      type: 'NEW_INVOICE',
      poReference,
      invoice
    }
  });
  
  window.dispatchEvent(invoiceEvent);
  console.log('Simulated new invoice:', invoice);
  
  return invoice;
};

// Simulate approving an invoice
export const simulateApproveInvoice = (invoice) => {
  const updatedInvoice = { 
    ...invoice, 
    status: 'Approved' 
  };

  // Dispatch event to update invoice status
  const invoiceEvent = new CustomEvent('invoice', {
    detail: {
      type: 'INVOICE_APPROVED',
      poReference: invoice.poReference,
      invoice: updatedInvoice
    }
  });
  
  window.dispatchEvent(invoiceEvent);
  console.log('Simulated invoice approval:', updatedInvoice);
  
  return updatedInvoice;
};

// Simulate rejecting an invoice
export const simulateRejectInvoice = (invoice) => {
  const updatedInvoice = { 
    ...invoice, 
    status: 'Rejected' 
  };

  // Dispatch event to update invoice status
  const invoiceEvent = new CustomEvent('invoice', {
    detail: {
      type: 'INVOICE_REJECTED',
      poReference: invoice.poReference,
      invoice: updatedInvoice
    }
  });
  
  window.dispatchEvent(invoiceEvent);
  console.log('Simulated invoice rejection:', updatedInvoice);
  
  return updatedInvoice;
};

// Run a complete workflow test
export const runWorkflowTest = async () => {
  console.log('Starting workflow test...');
  
  // Step 1: Create a new PO
  const po = simulateNewPO();
  console.log('Step 1: Created new PO', po.poNumber);
  
  // Step 2: Wait 2 seconds, then receive an invoice
  await new Promise(resolve => setTimeout(resolve, 2000));
  const invoice = simulateNewInvoice(po.poNumber);
  console.log('Step 2: Received invoice', invoice.invoiceNumber, 'for PO', po.poNumber);
  
  // Step 3: Wait 2 seconds, then approve the invoice
  await new Promise(resolve => setTimeout(resolve, 2000));
  const approvedInvoice = simulateApproveInvoice(invoice);
  console.log('Step 3: Approved invoice', approvedInvoice.invoiceNumber);
  
  console.log('Workflow test completed successfully!');
  return { po, invoice, approvedInvoice };
};

// Export a function to add a test button to the UI
export const addTestButton = () => {
  const button = document.createElement('button');
  button.textContent = 'Test PO-Invoice Workflow';
  button.className = 'btn btn-primary position-fixed';
  button.style.bottom = '20px';
  button.style.right = '20px';
  button.style.zIndex = '9999';
  
  button.addEventListener('click', () => {
    runWorkflowTest();
  });
  
  document.body.appendChild(button);
  console.log('Test button added to the UI');
}; 