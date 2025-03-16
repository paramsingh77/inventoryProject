import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import socket from '../utils/socket';
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

export const PurchaseOrderProvider = ({ children }) => {
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { addNotification } = useNotification();

  // Fetch all purchase orders - wrap in useCallback
  const fetchPurchaseOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching purchase orders from:', '/api/purchase-orders');
      const response = await api.get('/api/purchase-orders');
      console.log('Purchase orders API response:', response.data);
      
      // Format the orders
      const formattedOrders = response.data.map(order => ({
        id: order.id,
        poNumber: order.order_number,
        supplier: order.supplier_name || order.vendor_name || 'Unknown Vendor',
        vendor: {
          name: order.supplier_name || order.vendor_name || 'Unknown Vendor',
          email: order.supplier_email || order.vendor_email || ''
        },
        date: new Date(order.order_date || order.created_at).toISOString().split('T')[0],
        createdAt: order.created_at,
        total: parseFloat(order.total_amount || 0),
        totalAmount: parseFloat(order.total_amount || 0),
        status: order.status || 'pending',
        hasInvoice: order.has_invoice || false,
        items: order.items || []
      }));
      
      console.log('Formatted purchase orders:', formattedOrders);
      setPurchaseOrders(formattedOrders);
    } catch (err) {
      console.error('Error fetching purchase orders:', err);
      setError('Failed to load purchase orders');
      addNotification('error', 'Failed to load purchase orders');
    } finally {
      setLoading(false);
    }
  }, [addNotification]);  // add dependency

  // Add new purchase order - wrap in useCallback
  const addPurchaseOrder = useCallback((newPO) => {
    setPurchaseOrders(prev => [newPO, ...prev]);
    addNotification('success', 'Purchase order created successfully');
  }, [addNotification]); // add dependency

  // Update purchase order status - wrap in useCallback
  const updatePurchaseOrderStatus = useCallback((poId, newStatus) => {
    setPurchaseOrders(prev => prev.map(po => {
      if (po.id === poId || po.poNumber === poId) {
        return { ...po, status: newStatus };
      }
      return po;
    }));
    addNotification('info', `Purchase order ${poId} status updated to ${newStatus}`);
  }, [addNotification]); // add dependency

  // Delete purchase order - wrap in useCallback
  const deletePurchaseOrder = useCallback((poId) => {
    setPurchaseOrders(prev => prev.filter(po => po.id !== poId && po.poNumber !== poId));
    addNotification('success', `Purchase order ${poId} deleted successfully`);
  }, [addNotification]); // add dependency

  // Get filtered purchase orders
  const getFilteredPurchaseOrders = (filter = 'all') => {
    if (filter === 'all') return purchaseOrders;
    return purchaseOrders.filter(po => po.status === filter);
  };

  // Setup socket listeners for real-time updates
  useEffect(() => {
    // Initial fetch
    fetchPurchaseOrders();

    // Socket event listeners
    socket.on('po_status_update', (data) => {
      updatePurchaseOrderStatus(data.poId, data.status);
    });

    socket.on('new_po', (data) => {
      addPurchaseOrder(data);
    });

    socket.on('po_deleted', (data) => {
      deletePurchaseOrder(data.poId);
    });

    // Cleanup
    return () => {
      socket.off('po_status_update');
      socket.off('new_po');
      socket.off('po_deleted');
    };
  }, [fetchPurchaseOrders, updatePurchaseOrderStatus, addPurchaseOrder, deletePurchaseOrder]);

  const value = {
    purchaseOrders,
    loading,
    error,
    fetchPurchaseOrders,
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