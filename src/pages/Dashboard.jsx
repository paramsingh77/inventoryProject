import React from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useNavigate } from 'react-router-dom';
import {
  faBoxes,
  faUsers,
  faShoppingCart,
  faUserTie,
  faChartBar
} from '@fortawesome/free-solid-svg-icons';

const styles = {
  container: {
    fontFamily: 'Afacad, sans-serif',
    padding: '2rem'
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: '600',
    color: '#344767',
    marginBottom: '2rem'
  },
  card: {
    border: 'none',
    cursor: 'pointer',
    height: '100%',
    transition: 'all 0.3s ease'
  },
  icon: {
    fontSize: '2rem',
    marginBottom: '1rem'
  },
  cardTitle: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#344767',
    marginBottom: '0.5rem'
  },
  cardText: {
    fontSize: '0.875rem',
    color: '#67748e'
  }
};

const DashboardCard = ({ icon, title, description, color, path }) => {
  const navigate = useNavigate();

  return (
    <motion.div
      whileHover={{ y: -5 }}
      whileTap={{ scale: 0.98 }}
    >
      <Card 
        className="shadow-sm" 
        style={styles.card}
        onClick={() => navigate(path)}
      >
        <Card.Body className="p-4 text-center">
          <div 
            className={`rounded-circle mb-3 mx-auto d-flex align-items-center justify-content-center`}
            style={{ 
              width: '70px', 
              height: '70px',
              backgroundColor: `${color}20`
            }}
          >
            <FontAwesomeIcon 
              icon={icon} 
              style={{ ...styles.icon, color: color }}
            />
          </div>
          <h5 style={styles.cardTitle}>{title}</h5>
          <p style={styles.cardText} className="mb-0">
            {description}
          </p>
        </Card.Body>
      </Card>
    </motion.div>
  );
};

const Dashboard = () => {
  const cards = [
    {
      icon: faBoxes,
      title: 'Inventory',
      description: 'Manage products, stock levels, and categories',
      color: '#4CAF50',
      path: '/inventory'
    },
    {
      icon: faUsers,
      title: 'Users',
      description: 'Manage user accounts and permissions',
      color: '#2196F3',
      path: '/users'
    },
    {
      icon: faShoppingCart,
      title: 'Orders',
      description: 'Track and manage purchase orders',
      color: '#FF9800',
      path: '/orders'
    },
    {
      icon: faUserTie,
      title: 'Suppliers',
      description: 'Manage supplier information and contracts',
      color: '#9C27B0',
      path: '/suppliers'
    },
    {
      icon: faChartBar,
      title: 'Reports',
      description: 'View analytics and generate reports',
      color: '#F44336',
      path: '/reports'
    }
  ];

  return (
    <div style={styles.container}>
      <Container fluid>
        <h4 style={styles.title}>Dashboard</h4>
        <Row className="g-4">
          {cards.map((card, index) => (
            <Col key={index} md={6} lg={4} xl={4}>
              <DashboardCard {...card} />
            </Col>
          ))}
        </Row>
      </Container>
    </div>
  );
};

export default Dashboard; 