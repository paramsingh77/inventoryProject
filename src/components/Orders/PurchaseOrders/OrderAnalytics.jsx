import React, { useState, useEffect } from 'react';
import { Card, Row, Col, ButtonGroup, Button, Spinner } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faChartLine, 
  faShoppingCart, 
  faMoneyBill,
  faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons';
import { motion } from 'framer-motion';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Line, Pie } from 'react-chartjs-2';
import { getOrderAnalytics, processAnalyticsData } from '../../../services/orderAnalytics';
import { useSite, SiteProvider } from '../../../context/SiteContext';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const OrderAnalyticsContent = ({ orders = [], siteName }) => {
  const [timeRange, setTimeRange] = useState('monthly');
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const siteContext = useSite();
  const currentSite = siteContext.currentSite || { name: siteName };

  useEffect(() => {
    if (currentSite?.id) {
      fetchAnalytics();
    }
  }, [timeRange, currentSite]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getOrderAnalytics(timeRange);
      const processedData = processAnalyticsData(data);
      setAnalytics(processedData);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const metrics = analytics ? [
    {
      title: 'Total Orders',
      value: analytics.metrics.totalOrders.value.toLocaleString(),
      change: analytics.metrics.totalOrders.change,
      trend: analytics.metrics.totalOrders.change.startsWith('+') ? 'up' : 'down',
      icon: faShoppingCart
    },
    {
      title: 'Revenue',
      value: `$${analytics.metrics.revenue.value.toLocaleString()}`,
      change: analytics.metrics.revenue.change,
      trend: analytics.metrics.revenue.change.startsWith('+') ? 'up' : 'down',
      icon: faMoneyBill
    },
    {
      title: 'Average Order Value',
      value: `$${analytics.metrics.averageOrderValue.value.toLocaleString()}`,
      change: analytics.metrics.averageOrderValue.change,
      trend: analytics.metrics.averageOrderValue.change.startsWith('+') ? 'up' : 'down',
      icon: faChartLine
    },
    {
      title: 'Cancelled Orders',
      value: analytics.metrics.cancelledOrders.value.toLocaleString(),
      change: analytics.metrics.cancelledOrders.change,
      trend: analytics.metrics.cancelledOrders.change.startsWith('+') ? 'up' : 'down',
      icon: faExclamationTriangle
    }
  ] : [];

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom'
      }
    }
  };

  const lineChartData = analytics ? {
    labels: analytics.orderTrends.map(trend => trend.date),
    datasets: [{
      label: 'Orders',
      data: analytics.orderTrends.map(trend => trend.count),
      borderColor: '#0d6efd',
      backgroundColor: 'rgba(13, 110, 253, 0.1)',
      tension: 0.4,
      fill: true
    }]
  } : null;
  const pieChartData = analytics ? {
    labels: analytics.ordersByStatus.map(item => item.status.toUpperCase()),
    datasets: [{
      data: analytics.ordersByStatus.map(item => item.percentage),
      backgroundColor: [
        '#0d6efd',  // Primary
        '#198754',  // Success
        '#0dcaf0',  // Info
        '#ffc107',  // Warning
        '#dc3545'   // Danger
      ]
    }]
  } : null;

  if (!currentSite) {
    return (
      <div className="text-center p-4">
        <h5>Please select a site first</h5>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-danger p-4">
        <h5>Error loading analytics</h5>
        <p>{error}</p>
        <Button variant="primary" onClick={fetchAnalytics}>Retry</Button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4>Order Analytics</h4>
        <ButtonGroup>
          {['daily', 'weekly', 'monthly', 'yearly'].map(range => (
            <Button
              key={range}
              variant={timeRange === range ? 'primary' : 'outline-primary'}
              onClick={() => setTimeRange(range)}
              disabled={loading}
            >
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </Button>
          ))}
        </ButtonGroup>
      </div>

      {loading ? (
        <div className="text-center p-5">
          <Spinner animation="border" variant="primary" />
        </div>
      ) : (
        <>
          <Row className="g-4">
            {metrics.map((metric, index) => (
              <Col key={index} md={6} lg={3}>
                <Card className="border-0 shadow-sm h-100">
                  <Card.Body>
                    <div className="d-flex align-items-center mb-3">
                      <div className="rounded-3 p-3 bg-primary bg-opacity-10 me-3">
                        <FontAwesomeIcon icon={metric.icon} className="text-primary" />
                      </div>
                      <div>
                        <h6 className="text-secondary mb-1">{metric.title}</h6>
                        <h3 className="mb-0">{metric.value}</h3>
                      </div>
                    </div>
                    <div className={`text-${metric.trend === 'up' ? 'success' : 'danger'}`}>
                      {metric.change}
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>

          <Row className="mt-4 g-4">
            <Col md={8}>
              <Card className="border-0 shadow-sm">
                <Card.Body>
                  <h6 className="mb-4">Orders Overview</h6>
                  <div style={{ height: '300px' }}>
                    {lineChartData && <Line data={lineChartData} options={chartOptions} />}
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="border-0 shadow-sm">
                <Card.Body>
                  <h6 className="mb-4">Order Distribution</h6>
                  <div style={{ height: '300px' }}>
                    {pieChartData && <Pie data={pieChartData} options={chartOptions} />}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </>
      )}
    </motion.div>
  );
};

const OrderAnalytics = (props) => {
  try {
    useSite();
    return <OrderAnalyticsContent {...props} />;
  } catch (e) {
    return (
      <SiteProvider>
        <OrderAnalyticsContent {...props} />
      </SiteProvider>
    );
  }
};

export default OrderAnalytics; 