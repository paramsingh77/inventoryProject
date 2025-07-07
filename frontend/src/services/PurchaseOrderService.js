import api from '../utils/api';
import { generatePOPdf } from '../utils/pdfGenerator';
import PDFStorage from '../utils/pdfStorage.js';

class PurchaseOrderService {
    // Cache for PO data
    static poCache = new Map();

    // Handle PO approval
    static async approvePO(po, pdfBlob) {
        try {
            // Start with status update
            const response = await api.patch(`/purchase-orders/${po.id}/status`, {
                status: 'approved',
                comments: `Approved by ${localStorage.getItem('username') || 'Admin'} on ${new Date().toLocaleDateString()}`
            });

            // If we have PDF and vendor email, send it
            if (pdfBlob && po.vendor_email) {
                try {
                    const formData = new FormData();
                    
                    // Create a File object from the Blob
                    const file = new File([pdfBlob], `PO-${po.order_number}.pdf`, {
                        type: 'application/pdf'
                    });
                    
                    formData.append('pdfFile', file);
                    formData.append('to', po.vendor_email);
                    formData.append('subject', `Purchase Order ${po.order_number} Approved`);
                    formData.append('message', `Dear ${po.vendor_name},\n\nPlease find attached the approved purchase order ${po.order_number}.\n\nBest regards,\n${localStorage.getItem('username') || 'Admin'}`);

                    const emailResponse = await api.post('/purchase-orders/send-email', formData, {
                        headers: {
                            'Content-Type': 'multipart/form-data'
                        }
                    });

                    console.log('Email sent successfully:', emailResponse.data);
                } catch (emailError) {
                    console.error('Error sending email:', emailError);
                    throw {
                        success: false,
                        message: 'PO approved but email could not be sent to vendor',
                        error: emailError
                    };
                }
            }

            return {
                success: true,
                data: response.data,
                message: pdfBlob && po.vendor_email ? 
                    'Purchase order approved and sent to vendor' : 
                    'Purchase order approved successfully'
            };
        } catch (error) {
            console.error('Error in PO approval:', error);
            throw {
                success: false,
                message: error.message || 'Failed to approve purchase order',
                error: error
            };
        }
    }

    // Handle PO rejection
    static async rejectPO(po, rejectionReason) {
        try {
            if (!rejectionReason?.trim()) {
                throw new Error('Rejection reason is required');
            }

            // Update PO status
            const response = await api.patch(`/purchase-orders/${po.id}/status`, {
                status: 'rejected',
                comments: rejectionReason.trim(),
                username: localStorage.getItem('username') || 'Admin'
            });

            // Send rejection email if we have vendor email
            if (po.vendor_email) {
                const formData = new FormData();
                formData.append('to', po.vendor_email);
                formData.append('subject', `Purchase Order ${po.order_number} Rejected`);
                formData.append('message', `Dear ${po.vendor_name},\n\nYour purchase order ${po.order_number} has been rejected.\nReason: ${rejectionReason}\n\nPlease review and submit a new purchase order if needed.\n\nBest regards,\n${localStorage.getItem('username') || 'Admin'}`);

                try {
                    await api.post('/purchase-orders/send-email', formData, {
                        headers: {
                            'Content-Type': 'multipart/form-data'
                        }
                    });
                } catch (emailError) {
                    console.warn('Failed to send rejection email:', emailError);
                    // Continue with rejection even if email fails
                }
            }

            return {
                success: true,
                data: response.data,
                message: 'Purchase order rejected successfully'
            };
        } catch (error) {
            console.error('Error in PO rejection:', error);
            throw new Error(error.response?.data?.message || 'Failed to reject purchase order');
        }
    }

    // Generate or retrieve PDF
    static async getPDF(po) {
        try {
            const pdfKey = `po_pdf_${po.id}`;
            
            // Try to get from IndexedDB first
            try {
                const storedPdf = await PDFStorage.getPDF(pdfKey);
                if (storedPdf) {
                    console.log('Retrieved PDF from IndexedDB');
                    
                    // Ensure the blob has the correct MIME type
                    if (!(storedPdf instanceof Blob) || storedPdf.type !== 'application/pdf') {
                        return new Blob([storedPdf], { type: 'application/pdf' });
                    }
                    
                    return storedPdf;
                }
            } catch (storageError) {
                console.warn('Failed to retrieve from IndexedDB:', storageError);
            }

            // Try to get from server
            try {
                const response = await api.get(`/purchase-orders/${po.id}/pdf`, {
                    responseType: 'blob'
                });
                
                // Ensure the blob has the correct MIME type
                const pdfBlob = response.data.type === 'application/pdf' 
                    ? response.data 
                    : new Blob([response.data], { type: 'application/pdf' });
                
                // Store in IndexedDB for future use
                try {
                    await PDFStorage.storePDF(pdfKey, pdfBlob);
                    console.log('Stored PDF in IndexedDB');
                } catch (storageError) {
                    console.warn('Failed to store in IndexedDB:', storageError);
                }
                
                return pdfBlob;
            } catch (serverError) {
                console.warn('Failed to get PDF from server:', serverError);
                
                // Generate new PDF if not found on server
                const poData = {
                    poNumber: po.order_number,
                    createdAt: po.created_at,
                    vendor: {
                        name: po.vendor_name,
                        contactPerson: po.contact_person,
                        email: po.vendor_email,
                        phone: po.phone_number,
                        address: {
                            street: po.vendor_address || 'N/A',
                            city: '',
                            state: '',
                            zip: ''
                        }
                    },
                    items: po.items.map(item => ({
                        id: item.id,
                        sku: item.id,
                        name: item.name || 'Item',
                        description: item.notes || '',
                        quantity: item.quantity,
                        unitPrice: item.unit_price || item.price || 0,
                        productLink: item.productLink || item.product_link || ''
                    })),
                    subtotal: parseFloat(po.total_amount),
                    tax: parseFloat(po.total_amount) * 0.1,
                    taxRate: 10,
                    shippingFees: 50,
                    totalAmount: parseFloat(po.total_amount) + (parseFloat(po.total_amount) * 0.1) + 50,
                    deliveryDate: po.expected_delivery,
                    requestedBy: po.ordered_by_name
                };

                // LOGGING: Show the productLink values in service layer
                console.log('🔍 PurchaseOrderService - poData.items for PDF:', poData.items.map(item => ({
                    name: item.name,
                    productLink: item.productLink
                })));
                
                console.log('🔍 TRACKING - PurchaseOrderService: Final poData with hardcoded test:', JSON.stringify(poData, null, 2));
                
                const newPdfBlob = await generatePOPdf(poData, true);
                
                // Ensure the newly generated PDF has the correct MIME type
                const typedPdfBlob = newPdfBlob.type === 'application/pdf'
                    ? newPdfBlob
                    : new Blob([newPdfBlob], { type: 'application/pdf' });
                
                // Store the newly generated PDF in IndexedDB
                try {
                    await PDFStorage.storePDF(pdfKey, typedPdfBlob);
                    console.log('Stored generated PDF in IndexedDB');
                } catch (storageError) {
                    console.warn('Failed to store generated PDF in IndexedDB:', storageError);
                }
                
                return typedPdfBlob;
            }
        } catch (error) {
            console.error('Error generating/retrieving PDF:', error);
            throw new Error('Failed to generate/retrieve PDF');
        }
    }
}

export default PurchaseOrderService; 