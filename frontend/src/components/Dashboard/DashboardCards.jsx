import React, { useState, useEffect } from 'react';
import { Card, Row, Col } from 'react-bootstrap';
import { 
  FaTablet, 
  FaCheckCircle, 
  FaExclamationTriangle, 
  FaTools, 
  FaHistory 
} from 'react-icons/fa';
import api from '../../utils/api';

const DashboardCards = () => {
  const [stats, setStats] = useState({
    totalDevices: 0,
    activeDevices: 0,
    offlineDevices: 0,
    pendingUpdates: 0,
    recentActivity: 0,
    locationBreakdown: [],
    departmentBreakdown: [],
    lastUpdated: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDeviceStats = async () => {
    try {
      console.log('Fetching device stats...');
      setLoading(true);
      const response = await api.get('/api/devices/stats');
      console.log('Device stats response:', response.data);
      setStats(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching device stats:', err);
      setError('Failed to load device statistics');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeviceStats();
    // Poll every 30 seconds for real-time updates
    const interval = setInterval(fetchDeviceStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const cards = [
    {
      title: 'Total Devices',
      value: stats.totalDevices,
      icon: <FaTablet className="text-primary" size={24} />,
      bgClass: 'bg-light',
      subtitle: `${stats.locationBreakdown.length} Locations`
    },
    {
      title: 'Active Devices',
      value: stats.activeDevices,
      icon: <FaCheckCircle className="text-success" size={24} />,
      bgClass: 'bg-light',
      subtitle: 'Online in last 24h'
    },
    {
      title: 'Offline Devices',
      value: stats.offlineDevices,
      icon: <FaExclamationTriangle className="text-danger" size={24} />,
      bgClass: 'bg-light',
      subtitle: 'Need attention'
    },
    {
      title: 'Pending Review',
      value: stats.pendingUpdates,
      icon: <FaTools className="text-warning" size={24} />,
      bgClass: 'bg-light',
      subtitle: 'Maintenance needed'
    },
    {
      title: 'Recent Updates',
      value: stats.recentActivity,
      icon: <FaHistory className="text-info" size={24} />,
      bgClass: 'bg-light',
      subtitle: 'Updated in 24h'
    }
  ];

  if (loading) return <div>Loading device statistics...</div>;
  if (error) return <div className="text-danger">{error}</div>;

  return (
    <>
      <Row className="g-4 mb-4">
        {cards.map((card, index) => (
          <Col key={index} xs={12} sm={6} md={4} lg={3} xl={2}>
            <Card className={`h-100 ${card.bgClass} shadow-sm`}>
              <Card.Body className="d-flex flex-column align-items-center">
                <div className="mb-3">{card.icon}</div>
                <Card.Title className="text-center mb-1 fs-6">{card.title}</Card.Title>
                <h3 className="mb-0 fw-bold">{card.value}</h3>
                <small className="text-muted mt-2">{card.subtitle}</small>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
      {stats.lastUpdated && (
        <small className="text-muted">
          Last updated: {new Date(stats.lastUpdated).toLocaleString()}
        </small>
      )}
    </>
  );
};

export default DashboardCards; 