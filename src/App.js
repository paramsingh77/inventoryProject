import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Login from '../src/pages/Login'
import Dashboard from './pages/Dashboard';
import MainLayout from './components/Layout/MainLayout';
import Orders from './pages/Orders';
import { NotificationProvider } from './context/NotificationContext';
import { AuthProvider } from './context/AuthContext';
import Suppliers from './components/Suppliers';
import Sites from './pages/Sites';
import InventoryManagement from './pages/InventoryManagement';
import Inventory from './pages/Inventory';
import Users from './pages/Users';
import Reports from './pages/Reports';
import Settings from './pages/Settings';

function App() {
  return (
    <Router>
      <AuthProvider>
        <NotificationProvider>
          <div style={{ fontFamily: 'Afacad, sans-serif' }}>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              
              {/* Main Site Selection */}
              <Route path="/sites" element={<Sites />} />
              
              {/* Generic Routes */}
              <Route path="/dashboard" element={
                <MainLayout>
                  <Dashboard />
                </MainLayout>
              } />
              <Route path="/inventory" element={
                <MainLayout>
                  <Inventory />
                </MainLayout>
              } />
              
              {/* Site-Specific Routes */}
              <Route path="/inventory/:siteName" element={
                <MainLayout>
                  <Dashboard />
                </MainLayout>
              } />
              <Route path="/inventory/:siteName/dashboard" element={
                <MainLayout>
                  <Dashboard />
                </MainLayout>
              } />
              <Route path="/inventory/:siteName/inventory" element={
                <MainLayout>
                  <InventoryManagement />
                </MainLayout>
              } />
              <Route path="/inventory/:siteName/users" element={
                <MainLayout>
                  <Users />
                </MainLayout>
              } />
              <Route path="/inventory/:siteName/orders" element={
                <MainLayout>
                  <Orders />
                </MainLayout>
              } />
              <Route path="/inventory/:siteName/suppliers" element={
                <MainLayout>
                  <Suppliers />
                </MainLayout>
              } />
              <Route path="/inventory/:siteName/reports" element={
                <MainLayout>
                  <Reports />
                </MainLayout>
              } />
              <Route path="/inventory/:siteName/settings" element={
                <MainLayout>
                  <Settings />
                </MainLayout>
              } />
              
              {/* Default Route */}
              <Route path="/" element={<Login />} />
            </Routes>
          </div>
        </NotificationProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
