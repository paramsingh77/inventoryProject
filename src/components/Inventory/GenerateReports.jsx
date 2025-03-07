import React, { useState } from 'react';
import { Card, Row, Col, Button, Form, ProgressBar } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFileExcel,
  faFilePdf,
  faFileCsv,
  faCalendarAlt,
  faDownload,
  faSync,
  faHistory,
  faBell,
  faFileAlt
} from '@fortawesome/free-solid-svg-icons';
import { motion } from 'framer-motion';
import { useNotification } from '../../context/NotificationContext';
import StockAlerts from './StockAlerts';

const GenerateReports = () => {
  const [selectedReport, setSelectedReport] = useState('inventory');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [format, setFormat] = useState('pdf');
  const [isGenerating, setIsGenerating] = useState(false);
  const { showNotification } = useNotification();

  const reportTypes = [
    {
      id: 'inventory',
      title: 'Inventory Status',
      description: 'Current stock levels and product details',
      icon: faFileExcel
    },
    {
      id: 'stock',
      title: 'Stock Movement',
      description: 'Product inflow and outflow analysis',
      icon: faFilePdf
    },
    {
      id: 'alerts',
      title: 'Low Stock Alerts',
      description: 'Products below minimum stock level',
      icon: faFileCsv
    }
  ];

  const recentReports = [
    {
      id: 1,
      name: 'Inventory Status Report',
      date: '2024-01-20',
      format: 'PDF'
    },
    // Add more recent reports
  ];

  const handleGenerateReport = () => {
    setIsGenerating(true);
    // Simulate report generation
    setTimeout(() => {
      setIsGenerating(false);
      showNotification('success', 'Report generated successfully');
    }, 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="mb-0">Generate Reports</h4>
      </div>

      <Row className="g-4">
        <Col md={8}>
          {/* Report Configuration */}
          <Card className="border-0 shadow-sm mb-4">
            <Card.Body>
              <h5 className="mb-4">Report Configuration</h5>
              <Form>
                <Form.Group className="mb-4">
                  <Form.Label>Report Type</Form.Label>
                  <Row className="g-3">
                    {reportTypes.map((type) => (
                      <Col md={4} key={type.id}>
                        <motion.div whileHover={{ scale: 1.02 }}>
                          <Card
                            className={`border ${selectedReport === type.id ? 'border-primary' : ''}`}
                            onClick={() => setSelectedReport(type.id)}
                            style={{ cursor: 'pointer' }}
                          >
                            <Card.Body>
                              <div className="d-flex align-items-center mb-2">
                                <FontAwesomeIcon icon={type.icon} className="text-primary me-2" />
                                <h6 className="mb-0">{type.title}</h6>
                              </div>
                              <small className="text-secondary">
                                {type.description}
                              </small>
                            </Card.Body>
                          </Card>
                        </motion.div>
                      </Col>
                    ))}
                  </Row>
                </Form.Group>

                <Row className="g-3 mb-4">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Start Date</Form.Label>
                      <Form.Control
                        type="date"
                        value={dateRange.start}
                        onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>End Date</Form.Label>
                      <Form.Control
                        type="date"
                        value={dateRange.end}
                        onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-4">
                  <Form.Label>Export Format</Form.Label>
                  <div className="d-flex gap-3">
                    {['pdf', 'excel', 'csv'].map((f) => (
                      <Form.Check
                        key={f}
                        type="radio"
                        id={`format-${f}`}
                        label={f.toUpperCase()}
                        name="format"
                        checked={format === f}
                        onChange={() => setFormat(f)}
                      />
                    ))}
                  </div>
                </Form.Group>

                <Button
                  variant="primary"
                  onClick={handleGenerateReport}
                  disabled={isGenerating}
                  className="w-100"
                >
                  <FontAwesomeIcon 
                    icon={isGenerating ? faSync : faDownload} 
                    className={`me-2 ${isGenerating ? 'fa-spin' : ''}`}
                  />
                  {isGenerating ? 'Generating Report...' : 'Generate Report'}
                </Button>

                {isGenerating && (
                  <ProgressBar animated now={45} className="mt-3" />
                )}
              </Form>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          {/* Recent Reports */}
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h5 className="mb-0">Recent Reports</h5>
                <FontAwesomeIcon icon={faHistory} className="text-secondary" />
              </div>
              <div className="d-flex flex-column gap-3">
                {recentReports.map((report) => (
                  <motion.div
                    key={report.id}
                    whileHover={{ x: 5 }}
                    className="d-flex align-items-center justify-content-between p-3 bg-light rounded"
                  >
                    <div>
                      <h6 className="mb-1">{report.name}</h6>
                      <small className="text-secondary">
                        <FontAwesomeIcon icon={faCalendarAlt} className="me-2" />
                        {report.date}
                      </small>
                    </div>
                    <Button variant="light" size="sm">
                      <FontAwesomeIcon icon={faDownload} />
                    </Button>
                  </motion.div>
                ))}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </motion.div>
  );
};

export default GenerateReports; 