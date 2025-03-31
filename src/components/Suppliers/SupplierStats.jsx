import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Spinner } from 'react-bootstrap';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUserTie,
  faFileContract,
  faChartLine,
  faExchangeAlt,
  faFileAlt
} from '@fortawesome/free-solid-svg-icons';
import SupplierService from '../../services/SupplierService';

const SupplierStats = () => {
  const [stats, setStats] = useState({
    activeSuppliers: '...',
    contracts: '...',
    avgRating: '...',
    transactions: '...',
    documents: '...'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Try to fetch stats from API first
        try {
          const response = await SupplierService.getStats();
          if (response && response.data) {
            setStats({
              activeSuppliers: response.data.activeSuppliers.toString(),
              contracts: response.data.contracts.toString(),
              avgRating: typeof response.data.avgRating === 'number' 
                ? `${response.data.avgRating.toFixed(1)}/5`
                : response.data.avgRating,
              transactions: response.data.transactions.toString(),
              documents: '42' // Placeholder
            });
            setLoading(false);
            return;
          }
        } catch (apiError) {
          console.warn('Could not fetch supplier stats from API:', apiError);
          // Continue to fallback
        }
        
        // Fallback to counting suppliers if we couldn't get stats directly
        const suppliers = await SupplierService.getAllSuppliers();
        
        setStats({
          activeSuppliers: suppliers.filter(s => s.status === 'active').length.toString(),
          contracts: '28', // Placeholder
          avgRating: '4.2/5', // Placeholder
          transactions: '156', // Placeholder
          documents: '42' // Placeholder
        });
      } catch (error) {
        console.error('Error fetching supplier stats:', error);
        setError('Failed to load supplier statistics');
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();
  }, []);

  const modules = [
    {
      id: 'suppliers',
      title: 'Active Suppliers',
      icon: faUserTie,
      value: stats.activeSuppliers,
      color: 'primary'
    },
    {
      id: 'contracts',
      title: 'Contracts',
      icon: faFileContract,
      value: stats.contracts,
      color: 'success'
    },
    {
      id: 'rating',
      title: 'Avg. Rating',
      icon: faChartLine,
      value: stats.avgRating,
      color: 'warning'
    },
    {
      id: 'transactions',
      title: 'Transactions',
      icon: faExchangeAlt,
      value: stats.transactions,
      color: 'info'
    },
    {
      id: 'documents',
      title: 'Documents',
      icon: faFileAlt,
      value: stats.documents,
      color: 'secondary'
    }
  ];

  if (loading) {
    return (
      <div className="text-center py-4">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Loading supplier statistics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger">
        {error}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Row className="g-3">
        {modules.map(module => (
          <Col key={module.id} md={6} lg={4} xl={true}>
            <Card className="shadow-sm h-100">
              <Card.Body>
                <div className="d-flex align-items-center">
                  <div className={`rounded-3 p-3 bg-${module.color} bg-opacity-10 me-3`}>
                    <FontAwesomeIcon 
                      icon={module.icon} 
                      className={`text-${module.color}`}
                      size="lg"
                    />
                  </div>
                  <div>
                    <div className="fs-4 fw-semibold">{module.value}</div>
                    <div className="text-muted">{module.title}</div>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </motion.div>
  );
};

export default SupplierStats; 