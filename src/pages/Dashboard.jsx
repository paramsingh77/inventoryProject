import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import ThemeToggle from '../components/ThemeToggle';
import {
  faBoxes,
  faUsers,
  faShoppingCart,
  faUserTie,
  faChartBar
} from '@fortawesome/free-solid-svg-icons';

const getStyles = (darkMode) => ({
  container: {
    fontFamily: 'Afacad, sans-serif',
    padding: '2rem',
    backgroundColor: darkMode ? '#121212' : '#ffffff',
    minHeight: '100vh'
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: '600',
    color: darkMode ? '#ffffff' : '#344767',
    marginBottom: '2rem'
  },
  card: {
    border: 'none',
    cursor: 'pointer',
    height: '100%',
    transition: 'all 0.3s ease',
    backgroundColor: darkMode ? '#2a2a2a' : '#ffffff',
    boxShadow: darkMode 
      ? '0 4px 24px rgba(0, 0, 0, 0.3)'
      : '0 4px 24px rgba(0, 0, 0, 0.1)',
  },
  icon: {
    fontSize: '2rem',
    marginBottom: '1rem'
  },
  cardTitle: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: darkMode ? '#ffffff' : '#344767',
    marginBottom: '0.5rem'
  },
  cardText: {
    fontSize: '0.875rem',
    color: darkMode ? '#cccccc' : '#67748e'
  }
});

const DashboardCard = ({ icon, title, description, color, path }) => {
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  const styles = getStyles(darkMode);

  return (
    <motion.div
      whileHover={{ y: -5 }}
      whileTap={{ scale: 0.98 }}
    >
      <Card 
        className={`shadow-sm ${darkMode ? 'dark-card' : ''}`}
        style={styles.card}
        onClick={() => navigate(path)}
      >
        <Card.Body className="p-4 text-center">
          <div 
            className={`rounded-circle mb-3 mx-auto d-flex align-items-center justify-content-center`}
            style={{ 
              width: '70px', 
              height: '70px',
              backgroundColor: darkMode ? `${color}15` : `${color}20`
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
  const { darkMode } = useTheme();
  const styles = getStyles(darkMode);
  const location = useLocation();
  const params = useParams();
  const [currentSite, setCurrentSite] = useState(null);
  const [siteDisplay, setSiteDisplay] = useState("");
  
  // Try to get the site name from URL params, location state, or localStorage
  useEffect(() => {
    // Priority 1: URL params
    if (params.siteName) {
      setCurrentSite(params.siteName);
      setSiteDisplay(decodeURIComponent(params.siteName));
    } 
    // Priority 2: Location state
    else if (location.state && location.state.siteName) {
      setCurrentSite(location.state.siteName);
      setSiteDisplay(location.state.siteName);
    }
    // Priority 3: localStorage
    else {
      const lastSelectedSite = localStorage.getItem('lastSelectedSite');
      if (lastSelectedSite) {
        try {
          const siteData = JSON.parse(lastSelectedSite);
          setCurrentSite(siteData.siteName);
          setSiteDisplay(siteData.siteName);
        } catch (e) {
          console.error("Error parsing stored site data:", e);
          // Fallback to default site name
        }
      }
    }
  }, [location, params]);

  // Generate card paths based on whether we're in a site context or not
  const getCardData = () => {
    // Base data without site context
    const baseCards = [
      {
        icon: faBoxes,
        title: 'Inventory',
        description: 'Manage products, stock levels, and categories',
        color: '#4CAF50'
      },
      {
        icon: faUsers,
        title: 'Users',
        description: 'Manage user accounts and permissions',
        color: '#2196F3'
      },
      {
        icon: faShoppingCart,
        title: 'Orders',
        description: 'Track and manage purchase orders',
        color: '#FF9800'
      },
      {
        icon: faUserTie,
        title: 'Suppliers',
        description: 'Manage supplier information and contracts',
        color: '#9C27B0'
      },
      {
        icon: faChartBar,
        title: 'Reports',
        description: 'View analytics and generate reports',
        color: '#F44336'
      }
    ];
    
    // If we have a site context, use site-specific paths
    if (currentSite) {
      return baseCards.map(card => ({
        ...card,
        path: `/inventory/${currentSite}/${card.title.toLowerCase()}`
      }));
    }
    
    // Otherwise use general paths
    return baseCards.map(card => ({
      ...card,
      path: `/${card.title.toLowerCase()}`
    }));
  };

  const cards = getCardData();

  return (
    <div style={styles.container}>
      <ThemeToggle />
      <Container fluid>
        <h4 style={styles.title}>
          {siteDisplay ? `${siteDisplay} Dashboard` : 'Dashboard'}
        </h4>
        <Row className="g-4">
          {cards.map((card, index) => (
            <Col key={index} md={6} lg={4} xl={4}>
              <DashboardCard {...card} />
            </Col>
          ))}
        </Row>
      </Container>

      <style jsx="true">{`
        .dark-card {
          background-color: #2a2a2a;
          border: 1px solid #404040;
        }
        
        .dark-card:hover {
          box-shadow: 0 6px 30px rgba(0, 0, 0, 0.4) !important;
        }

        @media (prefers-color-scheme: dark) {
          body {
            background-color: #121212;
          }
        }
      `}</style>
    </div>
  );
};

export default Dashboard; 