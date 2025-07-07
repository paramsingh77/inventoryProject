import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Button, Spinner, Alert } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSyncAlt, faFilter, faSearch } from '@fortawesome/free-solid-svg-icons';
import TrackingCard from './TrackingCard';
import { useNotification } from '../../../context/NotificationContext';
import api from '../../../utils/api';
import { motion } from 'framer-motion';

const OrderTracking = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const { addNotification } = useNotification();
  
  // Fetch orders on component mount
  useEffect(() => {
    fetchOrderTracking();
  }, []);
  
  const fetchOrderTracking = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Updated endpoint to match backend route
      const response = await api.get('/purchase-orders/tracking');
      console.log('Tracking data received:', response.data); // Debug log
      setOrders(response.data);
    } catch (err) {
      console.error('Error fetching order tracking:', err);
      setError('Failed to load order tracking information');
      addNotification('error', 'Failed to load tracking data');
    } finally {
      setLoading(false);
    }
  };
  
  const handleRefresh = async () => {
    if (refreshing) return;
    
    try {
      setRefreshing(true);
      
      // First check for new emails
      await api.post('/api/email-processor/check-now');
      
      // Then refresh the tracking data
      await fetchOrderTracking();
      
      addNotification('success', 'Tracking information updated');
    } catch (err) {
      console.error('Error refreshing tracking data:', err);
      addNotification('error', 'Failed to refresh tracking data');
    } finally {
      setRefreshing(false);
    }
  };
  
  if (loading && !refreshing) {
    return (
      <Container className="my-4 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Loading tracking information...</p>
      </Container>
    );
  }
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Container className="my-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="mb-0">Order Tracking</h2>
          
          <Button 
            variant="outline-primary" 
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <FontAwesomeIcon 
              icon={faSyncAlt} 
              className={refreshing ? "me-2 fa-spin" : "me-2"} 
            />
            {refreshing ? 'Updating...' : 'Check for Updates'}
          </Button>
        </div>
        
        {error && (
          <Alert variant="danger" className="mb-4">
            {error}
          </Alert>
        )}
        
        <Row>
          {orders.length > 0 ? (
            orders.map(order => (
              <Col key={order.id} md={6} lg={4} className="mb-4">
                <TrackingCard order={order} />
              </Col>
            ))
          ) : (
            <Col xs={12}>
              <Alert variant="info">
                No tracking information available. Orders will appear here when tracking updates are received.
              </Alert>
            </Col>
          )}
        </Row>
      </Container>
    </motion.div>
  );
};

export default OrderTracking; 