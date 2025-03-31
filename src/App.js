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
import OrderAnalyticsWrapper from './components/Orders/OrderAnalyticsWrapper';
import { SiteProvider } from './context/SiteContext';
import SitePage from './pages/SitePage';
import UserLayout from './components/Layout/UserLayout';
import UserInventoryView from './pages/UserInventoryView';
import RoleBasedSiteRouter from './components/RoleBasedSiteRouter';
import EmailLogin from './components/Email-Login/EmailLoginUser';
import EmailLoginAdmin from './components/Email-Login/EmailLoginAdmin';
import EmailLoginUser from './components/Email-Login/EmailLoginUser';
function App() {
  return (
    <Router>
      <AuthProvider>
        <NotificationProvider>
          <SiteProvider>
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
              
              {/* Site-Specific Page */}
              <Route path="/sites/:siteName" element={<RoleBasedSiteRouter />} />
              
              {/* Default Route */}
              <Route path="/" element={<Login />} />
            
              <Route path="/otp" element={<EmailLogin />} />
              <Route path="/otp/admin" element={<EmailLoginAdmin />} />
              <Route path="/otp/user" element={<EmailLoginUser />} />
              <Route path="/authenticate/user/session/:token" element={<EmailLoginUser />} />
              <Route path="/authenticate/admin/session/:token" element={<EmailLoginAdmin />} />
            </Routes>
          </div>
          </SiteProvider>
            
        </NotificationProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
