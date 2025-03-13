import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { NotificationProvider } from './context/NotificationContext';
import { PurchaseOrderProvider } from './context/PurchaseOrderContext';
import PrivateRoute from './components/Auth/PrivateRoute';
import Login from './pages/Auth/Login';
import Dashboard from './pages/Dashboard';
import Sites from './pages/Sites';
import Inventory from './pages/Inventory';
import InventoryManagement from './pages/InventoryManagement';
import Users from './pages/Users';
import Orders from './pages/Orders';
import Suppliers from './pages/Suppliers';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import MainLayout from './components/Layout/MainLayout';
import { addTestButton } from './utils/testWorkflow';
import { addBackendTestButton } from './utils/testBackend';
import { addOrderTestButton } from './utils/testOrderFlow';
import { Container } from 'react-bootstrap';
import OrdersTabs from './components/Orders/OrdersTabs';
import InvoiceRoutes from './components/Orders/InvoiceRoutes';
import OrderTrackingCard from './components/Orders/OrderTrackingCard';
import AppRoutes from './routes';
import Layout from './components/Layout';
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/main.scss';

const App = () => {
    useEffect(() => {
        // Add test buttons in development mode
        if (process.env.NODE_ENV === 'development') {
            // Add workflow test button
            addTestButton();
            
            // Add backend diagnostic test button
            addBackendTestButton();
            
            // Add order flow test button
            addOrderTestButton();
        }
    }, []);

    return (
        <ThemeProvider>
            <AuthProvider>
                <NotificationProvider>
                    <PurchaseOrderProvider>
                        <Router>
                            <Container fluid className="p-4">
                                <Routes>
                                    {/* Public Routes */}
                                    <Route path="/login" element={<Login />} />

                                    {/* Private Routes */}
                                    <Route path="/" element={<PrivateRoute />}>
                                        <Route index element={<Navigate to="/sites" replace />} />
                                        <Route path="sites" element={<Sites />} />
                                        <Route path="dashboard" element={
                                            <MainLayout>
                                                <Dashboard />
                                            </MainLayout>
                                        } />
                                        <Route path="inventory" element={
                                            <MainLayout>
                                                <Inventory />
                                            </MainLayout>
                                        } />
                                        <Route path="inventory/:siteName" element={
                                            <MainLayout>
                                                <InventoryManagement />
                                            </MainLayout>
                                        } />
                                        <Route path="inventory/:siteName/inventory" element={
                                            <MainLayout>
                                                <InventoryManagement />
                                            </MainLayout>
                                        } />
                                        <Route path="users" element={
                                            <MainLayout>
                                                <Users />
                                            </MainLayout>
                                        } />
                                        <Route path="orders" element={
                                            <MainLayout>
                                                <Orders />
                                            </MainLayout>
                                        } />
                                        <Route path="orders/:orderId/track" element={
                                            <MainLayout>
                                                <OrderTrackingCard />
                                            </MainLayout>
                                        } />
                                        <Route path="invoices/*" element={
                                            <MainLayout>
                                                <InvoiceRoutes />
                                            </MainLayout>
                                        } />
                                        <Route path="suppliers" element={
                                            <MainLayout>
                                                <Suppliers />
                                            </MainLayout>
                                        } />
                                        <Route path="reports" element={
                                            <MainLayout>
                                                <Reports />
                                            </MainLayout>
                                        } />
                                        <Route path="settings" element={
                                            <MainLayout>
                                                <Settings />
                                            </MainLayout>
                                        } />
                                    </Route>

                                    {/* Catch all route */}
                                    <Route path="*" element={<Navigate to="/sites" replace />} />
                                </Routes>
                            </Container>
                        </Router>
                    </PurchaseOrderProvider>
                </NotificationProvider>
            </AuthProvider>
        </ThemeProvider>
    );
};

export default App; 