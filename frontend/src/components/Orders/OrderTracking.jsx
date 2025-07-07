import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { Button, Spinner } from 'react-bootstrap';

function OrderTracking() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchOrders();
    
    // Set up an interval to check for updates every 5 minutes
    const interval = setInterval(() => {
      fetchOrders(false); // silent refresh (no loading indicator)
    }, 300000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchOrders = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const response = await axios.get('/purchase-orders');
      setOrders('orderssd',response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Failed to load orders. Please try again.');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const handleCheckForUpdates = async () => {
    setLoading(true);
    try {
      await axios.get('/api/check-updates');
      await fetchOrders(false);
    } catch (err) {
      console.error('Error checking for updates:', err);
      setError('Failed to check for updates. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="order-tracking-container">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Order Tracking</h2>
        <Button 
          variant="outline-primary" 
          onClick={handleCheckForUpdates}
          disabled={loading}
          className="d-flex align-items-center"
        >
          {loading ? (
            <>
              <Spinner animation="border" size="sm" className="me-2" />
              Checking...
            </>
          ) : (
            <>
              <i className="bi bi-arrow-repeat me-2"></i>
              Check for Updates
            </>
          )}
        </Button>
      </div>
      
      {error && (
        <div className="alert alert-danger">{error}</div>
      )}
      
      <div className="row">
        {orders.length === 0 && !loading ? (
          <div className="col-12 text-center py-5">
            <p className="text-muted">No orders found. New orders will appear here when invoice emails are received.</p>
          </div>
        ) : (
          orders.map((order, index) => (
            <div className="col-md-6 mb-4" key={order._id || index}>
              <motion.div 
                className="card shadow-sm"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <div className="card-body">
                  <div className="d-flex justify-content-between mb-3">
                    <div>
                      <i className="bi bi-file-text text-primary me-2"></i>
                      <strong>{order.orderNumber}</strong>
                    </div>
                    <span className="badge bg-primary rounded-pill">{order.status}</span>
                  </div>
                  
                  <div className="mb-3">
                    <div className="text-muted mb-1">
                      <i className="bi bi-building me-2"></i>
                      Vendor
                    </div>
                    <strong>{order.vendor}</strong>
                  </div>
                  
                  <div className="mb-3">
                    <div className="text-muted mb-1">
                      <i className="bi bi-box me-2"></i>
                      Items
                    </div>
                    <ul className="list-unstyled">
                      {order.items.map((item, idx) => (
                        <li key={idx}>
                          {item.name} <span className="text-muted">x{item.quantity}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="text-muted small">
                    <i className="bi bi-clock-history me-1"></i>
                    Last updated: {new Date(order.lastUpdated).toLocaleString()}
                  </div>
                </div>
              </motion.div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default OrderTracking; 