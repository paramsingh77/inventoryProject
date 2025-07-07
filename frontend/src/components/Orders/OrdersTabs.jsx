import React, { useState, useEffect } from 'react';
import { Tabs, Tab, Alert, Button } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFileInvoice,
  faClipboardList,
  faHistory,
  faFileAlt,
  faTruck,
  faCheckDouble
} from '@fortawesome/free-solid-svg-icons';
import PurchaseOrders from './PurchaseOrders';
import OrderTracking from './OrderTracking/OrderTracking';
import OrderHistory from './PurchaseOrders/OrderHistory';
import ReportGenerator from './ReportGenerator/ReportGenerator';
import POApprovals from './PurchaseOrders/POApprovals';
import { PurchaseOrderProvider } from '../../context/PurchaseOrderContext';
import { motion } from 'framer-motion';
import { useSite } from '../../context/SiteContext';
import { useParams } from 'react-router-dom';
import { sitesService } from '../../services/sites.service';

// FIXED: Simplified PO flow - Only 'Purchase Orders', 'Order History', and 'Report Generator' tabs remain. Approval and tracking tabs removed.
const OrdersTabs = () => {
  const [key, setKey] = useState('purchase-orders');
  const [isAdmin, setIsAdmin] = useState(false);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Get the current site from URL params or context
  const { siteName } = useParams();
  const { currentSite, selectSite, sites } = useSite();
  
  console.log('OrdersTabs rendering with siteName:', siteName);
  console.log('Current site from context:', currentSite);
  
  // Define fetchSiteOrders OUTSIDE useEffect so it's accessible everywhere
  const fetchSiteOrders = async () => {
    if (!siteName) return;
    
    try {
      setLoading(true);
      console.log('About to fetch orders for site:', siteName);
      const data = await sitesService.getSiteOrders(siteName);
      console.log('Received orders:', data);
      setOrders(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching site orders:', err);
      setError('Failed to load orders for this site.');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    // Check if user is admin
    const userRole = localStorage.getItem('userRole');
    setIsAdmin(userRole === 'admin');
    
    // If site is in the URL but not selected in context, select it
    if (siteName && (!currentSite || currentSite.name !== siteName)) {
      const site = Array.isArray(sites) ? sites.find(s => s.name === siteName) : undefined;
      if (site) {
        selectSite(site.id);
      }
    }
  }, [siteName, currentSite, selectSite, sites]);
  
  // Fetch orders effect
  useEffect(() => {
    // Initial fetch
    fetchSiteOrders();
    
    // Set up polling
    const intervalId = setInterval(fetchSiteOrders, 60000);
    return () => clearInterval(intervalId);
  }, [siteName]);

  // If no site is selected, show a message
  if (!siteName) {
    return (
      <Alert variant="info">
        Please select a site to view its orders.
      </Alert>
    );
  }

  return (
    <PurchaseOrderProvider siteName={siteName}>
      <h2>Orders for {siteName}</h2>
      
      {error && (
        <Alert variant="danger">
          <div className="d-flex justify-content-between align-items-center">
            <span>{error}</span>
            <Button 
              variant="outline-danger" 
              size="sm" 
              onClick={() => {
                fetchSiteOrders();
              }}
            >
              Retry
            </Button>
          </div>
        </Alert>
      )}
      
      <Tabs
        id="orders-tabs"
        activeKey={key}
        onSelect={(k) => setKey(k)}
        className="mb-4"
      >
        <Tab
          eventKey="purchase-orders"
          title={
            <span>
              <FontAwesomeIcon icon={faFileInvoice} className="me-2" />
              Purchase Orders
            </span>
          }
        >
          <PurchaseOrders 
            siteName={siteName} 
          />
        </Tab>
        {/* FIXED: Approvals and Order Tracking tabs removed for simplified PO flow */}
        <Tab
          eventKey="order-history"
          title={
            <span>
              <FontAwesomeIcon icon={faHistory} className="me-2" />
              Order History
            </span>
          }
        >
          <OrderHistory siteName={siteName} />
        </Tab>
        <Tab
          eventKey="analytics"
          title={
            <span>
              <FontAwesomeIcon icon={faFileAlt} className="me-2" />
              Report Generator
            </span>
          }
        >
          <ReportGenerator siteName={siteName} />
        </Tab>
      </Tabs>
    </PurchaseOrderProvider>
  );
};

export default OrdersTabs; 