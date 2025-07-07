import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Badge, Spinner, Link } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../../utils/api';

const SitesList = () => {
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchSites();
  }, []);

  const fetchSites = async () => {
    try {
      setLoading(true);
      const response = await api.get('/sites');
      console.log('Fetched sites:', response.data); // Debug log
      setSites(response.data);
    } catch (error) {
      console.error('Error fetching sites:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSiteClick = (site) => {
    navigate(`/sites/${site.name}`);
  };

  if (loading) {
    return (
      <div className="text-center p-5">
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-danger p-4">
        <h5>Error loading sites</h5>
        <p>{error}</p>
        <Button variant="primary" onClick={fetchSites}>Retry</Button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <h2 className="mb-4">Sites</h2>
      <Row className="g-4">
        {sites.map(site => (
          <Col key={site.id} md={6} lg={4}>
            <Card 
              className="h-100 shadow-sm hover-card" 
              onClick={() => handleSiteClick(site)}
              style={{ cursor: 'pointer' }}
            >
              {site.image_url && (
                <Card.Img 
                  variant="top" 
                  src={site.image_url} 
                  alt={site.name}
                  style={{ height: '160px', objectFit: 'cover' }}
                />
              )}
              <Card.Body>
                <Card.Title>
                  <Link to={`/sites/${site.name}`}>
                    {site.name}
                  </Link>
                </Card.Title>
                <Card.Text>
                  {site.location && (
                    <small className="text-muted d-block">
                      Location: {site.location}
                    </small>
                  )}
                  <Badge 
                    bg={site.is_active ? 'success' : 'secondary'}
                    className="mt-2"
                  >
                    {site.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </motion.div>
  );
};

export default SitesList; 