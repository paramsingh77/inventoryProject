import React, { createContext, useContext, useState, useEffect } from 'react';
// Remove socket import
// import socket from '../utils/socket';
import { useNotification } from './NotificationContext';
import api from '../utils/api-es';

const PurchaseOrderContext = createContext();

export const usePurchaseOrders = () => {
  const context = useContext(PurchaseOrderContext);
  if (!context) {
    throw new Error('usePurchaseOrders must be used within a PurchaseOrderProvider');
  }
  return context;
};

export const PurchaseOrderProvider = ({ children, siteName }) => {
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [currentSite, setCurrentSite] = useState(siteName);
  const { addNotification } = useNotification();

  // Update site when prop changes
  useEffect(() => {
    if (siteName) {
      setCurrentSite(siteName);
    }
  }, [siteName]);

  // Fetch purchase orders for a specific site
  const fetchPurchaseOrders = async (site = currentSite) => {
    if (!site) {
      console.warn('No site provided to fetchPurchaseOrders');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Properly encode the site name
      const encodedSiteName = encodeURIComponent(site);
      console.log(`Fetching purchase orders for site: ${site} (encoded: ${encodedSiteName})...`);
      
      // Get the auth token
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No authentication token available');
        setError('Authentication required');
        addNotification('error', 'Please log in to view purchase orders');
        return;
      }
      
      // Use site-specific endpoint with encoded site name and auth token
      const response = await api.get(`/sites/${encodedSiteName}/orders`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Site purchase orders response:', response);
      
      // Defensive check for array
      if (!Array.isArray(response.data)) {
        setError('Purchase orders data is not an array.');
        setPurchaseOrders([]);
        setLoading(false);
        return;
      }
      
      // Format the orders
      const formattedOrders = response.data.map(order => ({
        id: order.id,
        poNumber: order.order_number,
        supplier: order.supplier_name || order.vendor_name || 'Unknown Vendor',
        vendor: {
          name: order.supplier_name || order.vendor_name || 'Unknown Vendor',
          companyName: order.supplier_name || order.vendor_name || 'Not Provided',
          contactPerson: order.supplier_contact_person || order.contact_person || order.supplier_name || order.vendor_name || 'Not Provided',
          email: order.supplier_email || order.vendor_email || order.email || 'Not Provided',
          phone: order.supplier_phone || order.phone_number || order.vendor_phone || order.phone || 'Not Provided',
          address: {
            street: order.supplier_address || 'Not Provided',
            city: 'Not Provided',
            state: 'Not Provided',
            zip: 'Not Provided',
            full: order.supplier_address || 'Address Not Provided'
          }
        },
        date: new Date(order.order_date || order.created_at).toISOString().split('T')[0],
        createdAt: order.created_at,
        total: parseFloat(order.total_amount || 0),
        totalAmount: parseFloat(order.total_amount || 0),
        status: order.status || 'pending',
        hasInvoice: order.has_invoice || false,
        items: order.items || [],
        site_id: order.site_id,
        siteName: site,
        // Add additional fields that might be needed for PDF generation
        deliveryDate: order.expected_delivery || order.delivery_date || 'Not Specified',
        paymentTerms: order.payment_terms || 'Net 30',
        shippingTerms: order.shipping_terms || 'Standard Delivery',
        shippingMethod: order.shipping_method || 'Ground',
        subtotal: parseFloat(order.subtotal || 0),
        tax: parseFloat(order.tax || 0),
        taxRate: parseFloat(order.tax_rate || 10),
        shippingFees: parseFloat(order.shipping_fees || 0),
        requestedBy: order.ordered_by_name || order.username || 'IT Manager'
      }));
      
      setPurchaseOrders(formattedOrders);
    } catch (err) {
      console.error(`Error fetching purchase orders for site ${site}:`, err);
      setError(`Failed to load purchase orders for ${site}`);
      addNotification('error', `Failed to load purchase orders for ${site}`);
    } finally {
      setLoading(false);
    }
  };

  // Add new purchase order with site_id
  const addPurchaseOrder = async (newPO) => {
    if (!currentSite) {
      addNotification('error', 'No site selected for creating purchase order');
      return;
    }
    
    try {
      // Add site information to the PO data
      const poWithSite = {
        ...newPO,
        site: currentSite
      };
       
      // log the poWithSite
      console.log('******************poWithSite******************', poWithSite);
      // Use site-specific endpoint
      const response = await api.post(`/sites/${currentSite}/orders`, poWithSite);
      
      // Add to local state
      setPurchaseOrders(prev => [response.data, ...prev]);
      addNotification('success', 'Purchase order created successfully');
      return response.data;
    } catch (err) {
      console.error('Error creating purchase order:', err);
      // addNotification('error', `Failed to create purchase order: ${err.message}`);
      // throw err;
    }
  };

  // Update purchase order status
  const updatePurchaseOrderStatus = async (poId, newStatus) => {
    if (!currentSite) {
      addNotification('error', 'No site selected for updating purchase order');
      return;
    }
    
    try {
      await api.patch(`/sites/${currentSite}/orders/${poId}/status`, { status: newStatus });
      
      // Update local state
      setPurchaseOrders(prev => prev.map(po => {
        if (po.id === poId || po.poNumber === poId) {
          return { ...po, status: newStatus };
        }
        return po;
      }));
      
      addNotification('info', `Purchase order ${poId} status updated to ${newStatus}`);
    } catch (err) {
      console.error('Error updating purchase order status:', err);
      addNotification('error', 'Failed to update purchase order status');
      throw err;
    }
  };

  // Delete purchase order
  const deletePurchaseOrder = async (poId) => {
    if (!currentSite) {
      addNotification('error', 'No site selected for deleting purchase order');
      return;
    }
    
    try {
      await api.delete(`/sites/${currentSite}/orders/${poId}`);
      
      // Update local state
      setPurchaseOrders(prev => prev.filter(po => po.id !== poId && po.poNumber !== poId));
      addNotification('success', `Purchase order ${poId} deleted successfully`);
    } catch (err) {
      console.error('Error deleting purchase order:', err);
      addNotification('error', 'Failed to delete purchase order');
      throw err;
    }
  };

  // Get filtered purchase orders
  const getFilteredPurchaseOrders = (filter = 'all') => {
    if (filter === 'all') return purchaseOrders;
    
    // Handle different status formats (lowercase, underscores, etc.)
    const normalizedFilter = filter.toLowerCase().replace(/_/g, ' ');
    
    return purchaseOrders.filter(po => {
      // Normalize the status for comparison
      const poStatus = (po.status || '').toLowerCase().replace(/_/g, ' ');
      return poStatus === normalizedFilter;
    });
  };

  // Manual refresh function
  const refreshPurchaseOrders = () => {
    fetchPurchaseOrders(currentSite);
  };

  // Fetch orders when site changes or refresh is triggered
  useEffect(() => {
    if (currentSite) {
      fetchPurchaseOrders(currentSite);
    }
  }, [currentSite, refreshTrigger]);

  const value = {
    purchaseOrders,
    loading,
    error,
    currentSite,
    fetchPurchaseOrders,
    refreshPurchaseOrders,
    addPurchaseOrder,
    updatePurchaseOrderStatus,
    deletePurchaseOrder,
    getFilteredPurchaseOrders
  };

  return (
    <PurchaseOrderContext.Provider value={value}>
      {children}
    </PurchaseOrderContext.Provider>
  );
}; 