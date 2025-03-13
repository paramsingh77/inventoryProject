import React, { useState, useEffect } from 'react';
import { Tabs, Tab } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFileInvoice,
  faClipboardList,
  faHistory,
  faChartLine,
  faTruck,
  faCheckDouble
} from '@fortawesome/free-solid-svg-icons';
import PurchaseOrders from './PurchaseOrders';
import OrderTracking from './PurchaseOrders/OrderTracking';
import OrderHistory from './PurchaseOrders/OrderHistory';
import OrderAnalytics from './PurchaseOrders/OrderAnalytics';
import POApprovals from './PurchaseOrders/POApprovals';

const OrdersTabs = () => {
  const [key, setKey] = useState('purchase-orders');
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Check if user is admin
    const userRole = localStorage.getItem('userRole');
    setIsAdmin(userRole === 'admin');
  }, []);

  return (
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
        <PurchaseOrders />
      </Tab>
      
      {isAdmin && (
        <Tab
          eventKey="approvals"
          title={
            <span>
              <FontAwesomeIcon icon={faCheckDouble} className="me-2" />
              Approvals
            </span>
          }
        >
          <POApprovals />
        </Tab>
      )}

      <Tab
        eventKey="order-tracking"
        title={
          <span>
            <FontAwesomeIcon icon={faTruck} className="me-2" />
            Order Tracking
          </span>
        }
      >
        <OrderTracking />
      </Tab>
      
      <Tab
        eventKey="order-history"
        title={
          <span>
            <FontAwesomeIcon icon={faHistory} className="me-2" />
            Order History
          </span>
        }
      >
        <OrderHistory />
      </Tab>
      
      <Tab
        eventKey="analytics"
        title={
          <span>
            <FontAwesomeIcon icon={faChartLine} className="me-2" />
            Analytics
          </span>
        }
      >
        <OrderAnalytics />
      </Tab>
    </Tabs>
  );
};

export default OrdersTabs; 