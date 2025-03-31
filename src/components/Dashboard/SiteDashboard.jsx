import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSite } from '../../contexts/SiteContext';
import { Spinner } from 'react-bootstrap';
import Inventory from '../Inventory/Inventory';
import Suppliers from '../Suppliers/Suppliers';
import PurchaseOrders from '../Orders/PurchaseOrders/PurchaseOrders';
import OrderAnalytics from '../Orders/PurchaseOrders/OrderAnalytics';

const SiteDashboard = () => {
  const { currentSite, loading } = useSite();

  if (loading) {
    return (
      <div className="text-center p-5">
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  if (!currentSite) {
    return <Navigate to="/sites" replace />;
  }

  return (
    <div>
      <h2 className="mb-4">{currentSite.name} Dashboard</h2>
      <Routes>
        <Route path="inventory" element={<Inventory />} />
        <Route path="suppliers" element={<Suppliers />} />
        <Route path="purchase-orders" element={<PurchaseOrders />} />
        <Route path="analytics" element={<OrderAnalytics />} />
        <Route path="*" element={<Navigate to="inventory" replace />} />
      </Routes>
    </div>
  );
};

export default SiteDashboard; 