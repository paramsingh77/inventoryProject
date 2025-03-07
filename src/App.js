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

function App() {
  return (
    <Router>
      <AuthProvider>
        <NotificationProvider>
          <div style={{ fontFamily: 'Afacad, sans-serif' }}>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/sites" element={<Sites />} />
              <Route path="/inventory/:siteName" element={
                <MainLayout>
                  <InventoryManagement />
                </MainLayout>
              } />
              <Route path="/orders" element={<Orders />} />
              <Route path="/suppliers" element={<Suppliers />} />
              <Route path="/dashboard" element={<MainLayout><Dashboard /></MainLayout>} />
              <Route path="/" element={<Login />} />
            </Routes>
          </div>
        </NotificationProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
