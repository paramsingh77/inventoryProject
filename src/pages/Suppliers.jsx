import React, { useState } from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUserTie,
  faFileContract,
  faChartLine,
  faExchangeAlt,
  faFileAlt,
  faQuestionCircle,
  faPlus,
  faArrowLeft
} from '@fortawesome/free-solid-svg-icons';
import AddSupplier from '../components/Suppliers/AddSupplier';
import SupplierList from '../components/Suppliers/SupplierList';
import SupplierContracts from '../components/Suppliers/SupplierContracts';
import SupplierPerformance from '../components/Suppliers/SupplierPerformance';
import SupplierTransactions from '../components/Suppliers/SupplierTransactions';
import SupplierDocuments from '../components/Suppliers/SupplierDocuments';
import SupplierDocs from '../components/Suppliers/SupplierDocs';
import SupplierStats from '../components/Suppliers/SupplierStats';
import { useNotification } from '../context/NotificationContext';
import SyncInventory from '../components/Inventory/SyncInventory';

const styles = {
  container: {
    fontFamily: 'Afacad, sans-serif'
  },
  card: {
    border: 'none',
    transition: 'all 0.3s ease'
  },
  cardHeader: {
    background: 'transparent',
    borderBottom: 'none',
    padding: '1.5rem'
  },
  title: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#344767'
  },
  subtitle: {
    fontSize: '0.875rem',
    color: '#67748e'
  }
};

const Suppliers = () => {
  const [activeModule, setActiveModule] = useState(null);
  const { addNotification } = useNotification();

  const supplierModules = [
    {
      id: 'supplier-list',
      title: 'Supplier Management',
      icon: faUserTie,
      description: 'Manage supplier profiles and information'
    },
    {
      id: 'contracts',
      title: 'Contracts & Agreements',
      icon: faFileContract,
      description: 'Manage supplier contracts and terms'
    },
    {
      id: 'performance',
      title: 'Supplier Performance',
      icon: faChartLine,
      description: 'Track and analyze supplier metrics'
    },
    {
      id: 'transactions',
      title: 'Transaction History',
      icon: faExchangeAlt,
      description: 'View past orders and payments'
    },
    {
      id: 'documents',
      title: 'Supplier Documents',
      icon: faFileAlt,
      description: 'Manage supplier documents and files'
    }
  ];

  const handleSupplierAdded = (supplier) => {
    addNotification('success', `Supplier "${supplier.name}" added successfully`);
    
    // Navigate to supplier list to see the new supplier
    setTimeout(() => {
      setActiveModule('supplier-list');
    }, 2000);
  };

  return (
    <div style={styles.container}>
      <Container fluid>
        <AnimatePresence mode="wait">
          {!activeModule ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Supplier Statistics */}
              <div className="mb-4">
                <h4 style={styles.title} className="mb-3">Supplier Overview</h4>
                <SupplierStats />
              </div>

              {/* Action Buttons */}
              <div className="mb-4 d-flex gap-2">
                <Button 
                  variant="primary" 
                  className="d-flex align-items-center"
                  onClick={() => setActiveModule('add-supplier')}
                >
                  <FontAwesomeIcon icon={faPlus} className="me-2" />
                  Add New Supplier
                </Button>
                
                <SyncInventory onSyncComplete={(data) => {
                  console.log('Sync completed:', data);
                  addNotification('success', 'Inventory sync completed successfully');
                  // Optionally refresh your supplier list or stats here
                }} />
                
                <Button 
                  variant="outline-secondary" 
                  className="d-flex align-items-center"
                  onClick={() => setActiveModule('documentation')}
                >
                  <FontAwesomeIcon icon={faQuestionCircle} className="me-2" />
                  Documentation
                </Button>
              </div>

              {/* Module Cards */}
              <h4 style={styles.title} className="mb-3">Supplier Management Modules</h4>
              <Row className="g-4">
                {supplierModules.map((module) => (
                  <Col key={module.id} md={6} lg={4} xl={true}>
                    <motion.div
                      whileHover={{ y: -5 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Card 
                        className="h-100 shadow-sm cursor-pointer" 
                        style={{ ...styles.card, cursor: 'pointer' }}
                        onClick={() => setActiveModule(module.id)}
                      >
                        <Card.Body className="p-4">
                          <div className="d-flex align-items-center mb-3">
                            <div className="rounded-3 p-3 bg-primary bg-opacity-10 me-3">
                              <FontAwesomeIcon 
                                icon={module.icon} 
                                className="text-primary" 
                                size="lg"
                              />
                            </div>
                            <h5 style={styles.title}>{module.title}</h5>
                          </div>
                          <p style={styles.subtitle}>
                            {module.description}
                          </p>
                        </Card.Body>
                      </Card>
                    </motion.div>
                  </Col>
                ))}
              </Row>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Button
                variant="light"
                className="mb-4"
                onClick={() => setActiveModule(null)}
              >
                <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
                Back to Suppliers
              </Button>
              {activeModule === 'add-supplier' && (
                <AddSupplier 
                  onClose={() => setActiveModule(null)} 
                  onSuccess={handleSupplierAdded}
                />
              )}
              {activeModule === 'supplier-list' && <SupplierList />}
              {activeModule === 'contracts' && <SupplierContracts />}
              {activeModule === 'performance' && <SupplierPerformance />}
              {activeModule === 'transactions' && <SupplierTransactions />}
              {activeModule === 'documents' && <SupplierDocuments />}
              {activeModule === 'documentation' && <SupplierDocs />}
            </motion.div>
          )}
        </AnimatePresence>
      </Container>
    </div>
  );
};

export default Suppliers; 