import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { NotificationProvider } from './context/NotificationContext';
import PrivateRoute from './components/Auth/PrivateRoute';
import Login from './pages/Auth/Login';
import Dashboard from './pages/Dashboard';
import Sites from './pages/Sites';
import Inventory from './pages/Inventory';
import InventoryManagement from './pages/InventoryManagement';
import Orders from './pages/Orders';
import Suppliers from './pages/Suppliers';
import Users from './pages/Users';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import MainLayout from './components/Layout/MainLayout';

const App = () => {
    return (
        <ThemeProvider>
            <AuthProvider>
                <NotificationProvider>
                    <Router>
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
                    </Router>
                </NotificationProvider>
            </AuthProvider>
        </ThemeProvider>
    );
};

export default App; 