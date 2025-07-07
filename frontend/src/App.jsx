import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { NotificationProvider } from './context/NotificationContext';
import { PurchaseOrderProvider } from './context/PurchaseOrderContext';
import PrivateRoute from './components/Auth/PrivateRoute';
import Login from './pages/Auth/Login';
import Logout from './components/Auth/Logout';
import Dashboard from './pages/Dashboard';
import Sites from './pages/Sites';
import Inventory from './pages/Inventory';
import InventoryManagement from './pages/InventoryManagement';
import Users from './pages/Users';
import Orders from './pages/Orders';
import Suppliers from './pages/Suppliers';
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
import OrderHistory from './components/Orders/PurchaseOrders/OrderHistory';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import PageLayout from './components/Layout/PageLayout';
import MockUserManagement from './pages/MockUserManagement';
import SiteDetails from './components/Sites/SiteDetails';
import NotFound from './pages/NotFound';
import Unauthorized from './pages/Unauthorized';
import ApiTest from './pages/ApiTest';
import { SiteProvider } from './context/SiteContext';
import SitesList from './components/Sites/SitesList';
import SiteDashboard from './components/Dashboard/SiteDashboard';
import { SafeSiteProvider } from './contexts/SafeSiteContext';
import OrdersTabsWrapper from './components/Orders/OrdersTabsWrapper';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import SimpleResetPassword from './components/SimpleResetPassword';
import DevUserCreate from './components/DevUserCreate';
import Register from './components/Register';
import ITStore from './pages/ITStore';

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

    // Add this effect to synchronize site selection across the app
    useEffect(() => {
        const syncSiteSelection = () => {
            const currentSite = localStorage.getItem('selectedSiteName');
            if (currentSite) {
                console.log("App-level site synchronization:", currentSite);
                // Dispatch events to notify all components
                window.dispatchEvent(new Event('storage'));
                window.dispatchEvent(new CustomEvent('siteChanged', { 
                    detail: { siteName: currentSite } 
                }));
            }
        };
        
        // Run once on app initialization
        syncSiteSelection();
        
        // Set up interval to check periodically (optional)
        const intervalId = setInterval(syncSiteSelection, 2000);
        
        return () => clearInterval(intervalId);
    }, []);

    return (
        <Router>
            <ThemeProvider>
                <AuthProvider>
                    <SiteProvider>
                        <NotificationProvider>
                            <SafeSiteProvider>
                                <PurchaseOrderProvider>
                                    <Container fluid className="p-4">
                                        <Routes>
                                            {/* Public Routes */}
                                            <Route path="/login" element={<Login />} />
                                            <Route path="/logout" element={<Logout />} />
                                            <Route path="/register" element={<Register />} />

                                            {/* Private Routes */}
                                            <Route path="/" element={<PrivateRoute />}>
                                                <Route index element={<Navigate to="/sites" replace />} />
                                                <Route path="sites" element={
                                                    <ProtectedRoute requiredRole="admin">
                                                        <SitesList />
                                                    </ProtectedRoute>
                                                } />
                                                <Route path="sites/:siteName" element={
                                                    <ProtectedRoute>
                                                        <SiteDashboard />
                                                    </ProtectedRoute>
                                                } />
                                                <Route path="dashboard" element={
                                                    <MainLayout>
                                                        <SiteDashboard />
                                                    </MainLayout>
                                                } />
                                                <Route path="inventory" element={
                                                    <ProtectedRoute>
                                                        <Inventory />
                                                    </ProtectedRoute>
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
                                                <Route path="inventory/:siteName/orders" element={
                                                    <MainLayout>
                                                        <OrdersTabsWrapper />
                                                    </MainLayout>
                                                } />
                                                <Route path="inventory/:siteName/store" element={
                                                    <MainLayout>
                                                        <ITStore />
                                                    </MainLayout>
                                                } />
                                                <Route path="users" element={
                                                    <ProtectedRoute requiredRole="admin">
                                                        <PageLayout>
                                                            <Users />
                                                        </PageLayout>
                                                    </ProtectedRoute>
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
                                                <Route path="settings" element={
                                                    <MainLayout>
                                                        <Settings />
                                                    </MainLayout>
                                                } />
                                                <Route path="order-history" element={<OrderHistory />} />
                                                <Route path="mock-users" element={
                                                    <ProtectedRoute>
                                                        <PageLayout>
                                                            <MockUserManagement />
                                                        </PageLayout>
                                                    </ProtectedRoute>
                                                } />
                                            </Route>

                                            {/* Error routes */}
                                            <Route path="/unauthorized" element={<Unauthorized />} />
                                            <Route path="/not-found" element={<NotFound />} />

                                            {/* API test route */}
                                            <Route path="/api-test" element={<ApiTest />} />

                                            {/* Password reset routes */}
                                            <Route path="/forgot-password" element={<ForgotPassword />} />
                                            <Route path="/reset-password" element={<SimpleResetPassword />} />

                                            {/* Development user creation route */}
                                            <Route path="/dev/create-user" element={<DevUserCreate />} />

                                            {/* Catch all route */}
                                            <Route path="*" element={<Navigate to="/not-found" replace />} />
                                        </Routes>
                                    </Container>
                                </PurchaseOrderProvider>
                            </SafeSiteProvider>
                        </NotificationProvider>
                    </SiteProvider>
                </AuthProvider>
            </ThemeProvider>
        </Router>
    );
};

export default App; 