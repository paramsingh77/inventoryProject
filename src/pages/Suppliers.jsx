import React, { useState } from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUserTie,
  faFileContract,
  faChartLine,
  faHistory,
  faPlus,
  faArrowLeft
} from '@fortawesome/free-solid-svg-icons';
import AddSupplier from '../components/Suppliers/AddSupplier';
import SupplierList from '../components/Suppliers/SupplierList';
import SupplierContracts from '../components/Suppliers/SupplierContracts';
import SupplierPerformance from '../components/Suppliers/SupplierPerformance';
import TransactionHistory from '../components/Suppliers/TransactionHistory';

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
  },
  statValue: {
    fontSize: '1.5rem',
    fontWeight: '600',
    color: '#344767',
    marginBottom: '0.25rem'
  },
  statLabel: {
    fontSize: '0.875rem',
    color: '#67748e'
  }
};

const Suppliers = () => {
  const [activeModule, setActiveModule] = useState(null);

  const supplierModules = [
    {
      id: 'supplier-list',
      title: 'Supplier Management',
      icon: faUserTie,
      description: 'Manage supplier profiles and information',
      stats: { value: '45', label: 'Active Suppliers' }
    },
    {
      id: 'contracts',
      title: 'Contracts & Agreements',
      icon: faFileContract,
      description: 'Manage supplier contracts and terms',
      stats: { value: '28', label: 'Active Contracts' }
    },
    {
      id: 'performance',
      title: 'Supplier Performance',
      icon: faChartLine,
      description: 'Track and analyze supplier metrics',
      stats: { value: '92%', label: 'Avg. Rating' }
    },
    {
      id: 'history',
      title: 'Transaction History',
      icon: faHistory,
      description: 'View past orders and payments',
      stats: { value: '156', label: 'Transactions' }
    }
  ];

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
              {/* Quick Stats */}
              <Row className="g-3 mb-4">
                {supplierModules.map(module => (
                  <Col key={module.id} md={3}>
                    <Card className="shadow-sm" style={styles.card}>
                      <Card.Body>
                        <div className="d-flex align-items-center">
                          <div className="rounded-3 p-3 bg-primary bg-opacity-10 me-3">
                            <FontAwesomeIcon 
                              icon={module.icon} 
                              className="text-primary" 
                              size="lg"
                            />
                          </div>
                          <div>
                            <div style={styles.statValue}>{module.stats.value}</div>
                            <div style={styles.statLabel}>{module.stats.label}</div>
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>

              {/* Add Supplier Button */}
              <div className="mb-4">
                <Button 
                  variant="primary" 
                  className="d-flex align-items-center"
                  onClick={() => setActiveModule('add-supplier')}
                >
                  <FontAwesomeIcon icon={faPlus} className="me-2" />
                  Add New Supplier
                </Button>
              </div>

              {/* Module Cards */}
              <Row className="g-4">
                {supplierModules.map((module) => (
                  <Col key={module.id} md={6} lg={3}>
                    <motion.div
                      whileHover={{ y: -5 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Card 
                        className="h-100 shadow-sm cursor-pointer" 
                        style={styles.card}
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
              {activeModule === 'add-supplier' && <AddSupplier />}
              {activeModule === 'supplier-list' && <SupplierList />}
              {activeModule === 'contracts' && <SupplierContracts />}
              {activeModule === 'performance' && <SupplierPerformance />}
              {activeModule === 'history' && <TransactionHistory />}
            </motion.div>
          )}
        </AnimatePresence>
      </Container>
    </div>
  );
};

export default Suppliers; 