import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Row, 
  Col, 
  Card, 
  Button, 
  Table, 
  Badge, 
  Modal, 
  Spinner, 
  Alert,
  Nav
} from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faFileAlt, 
  faEye, 
  faChartBar,
  faRefresh
} from '@fortawesome/free-solid-svg-icons';
import { motion } from 'framer-motion';
import { usePurchaseOrders } from '../../../context/PurchaseOrderContext';
import { useNotification } from '../../../context/NotificationContext';
import ReportFilters from './ReportFilters';
import ReportExport from './ReportExport';
import reportExportService from '../../../services/reportExportService';
import './ReportGenerator.css';

const ReportGenerator = ({ siteName }) => {
  const [activeReport, setActiveReport] = useState('summary');
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [filters, setFilters] = useState({
    dateRange: 'last30days',
    status: 'all',
    vendor: 'all',
    minAmount: '',
    maxAmount: '',
    startDate: '',
    endDate: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  
  const { purchaseOrders, loading: ordersLoading } = usePurchaseOrders();
  const { addNotification } = useNotification();

  // Report types configuration
  const reportTypes = [
    {
      id: 'summary',
      name: 'Executive Summary',
      description: 'High-level overview of all purchase orders',
      icon: faChartBar
    },
    {
      id: 'vendor-analysis',
      name: 'Vendor Analysis',
      description: 'Detailed analysis by vendor',
      icon: faFileAlt
    },
    {
      id: 'financial-summary',
      name: 'Financial Summary',
      description: 'Financial metrics and trends',
      icon: faChartBar
    },
    {
      id: 'status-report',
      name: 'Status Report',
      description: 'Orders by status and timeline',
      icon: faFileAlt
    },
    {
      id: 'detailed-list',
      name: 'Detailed List',
      description: 'Complete list with all details',
      icon: faFileAlt
    }
  ];

  // Generate report based on type and filters
  const generateReport = async () => {
    setLoading(true);
    try {
      const filteredData = applyFilters(purchaseOrders);
      const processedData = processReportData(filteredData, activeReport);
      setReportData(processedData);
      addNotification('success', 'Report generated successfully');
    } catch (error) {
      console.error('Error generating report:', error);
      addNotification('error', 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  // Apply filters to purchase orders
  const applyFilters = (orders) => {
    let filtered = [...orders];

    // Date range filter
    if (filters.dateRange !== 'custom') {
      const now = new Date();
      let startDate = new Date();
      
      switch (filters.dateRange) {
        case 'last7days':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'last30days':
          startDate.setDate(now.getDate() - 30);
          break;
        case 'last90days':
          startDate.setDate(now.getDate() - 90);
          break;
        case 'thisYear':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          break;
      }
      
      filtered = filtered.filter(order => {
        const orderDate = new Date(order.createdAt);
        return orderDate >= startDate && orderDate <= now;
      });
    } else if (filters.startDate && filters.endDate) {
      const start = new Date(filters.startDate);
      const end = new Date(filters.endDate);
      filtered = filtered.filter(order => {
        const orderDate = new Date(order.createdAt);
        return orderDate >= start && orderDate <= end;
      });
    }

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(order => order.status === filters.status);
    }

    // Vendor filter
    if (filters.vendor !== 'all') {
      filtered = filtered.filter(order => 
        order.vendor?.name === filters.vendor || order.vendor_name === filters.vendor
      );
    }

    // Amount filters
    if (filters.minAmount) {
      filtered = filtered.filter(order => 
        parseFloat(order.totalAmount || order.total || 0) >= parseFloat(filters.minAmount)
      );
    }
    if (filters.maxAmount) {
      filtered = filtered.filter(order => 
        parseFloat(order.totalAmount || order.total || 0) <= parseFloat(filters.maxAmount)
      );
    }

    return filtered;
  };

  // Process data for different report types
  const processReportData = (data, reportType) => {
    switch (reportType) {
      case 'summary':
        return processSummaryReport(data);
      case 'vendor-analysis':
        return processVendorAnalysis(data);
      case 'financial-summary':
        return processFinancialSummary(data);
      case 'status-report':
        return processStatusReport(data);
      case 'detailed-list':
        return processDetailedList(data);
      default:
        return data;
    }
  };

  // Process summary report
  const processSummaryReport = (data) => {
    const totalOrders = data.length;
    const totalAmount = data.reduce((sum, order) => 
      sum + parseFloat(order.totalAmount || order.total || 0), 0
    );
    const avgOrderValue = totalOrders > 0 ? totalAmount / totalOrders : 0;
    
    const statusCounts = data.reduce((acc, order) => {
      const status = order.status || 'unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    const vendorCounts = data.reduce((acc, order) => {
      const vendor = order.vendor?.name || order.vendor_name || 'Unknown';
      acc[vendor] = (acc[vendor] || 0) + 1;
      return acc;
    }, {});

    return {
      type: 'summary',
      totalOrders,
      totalAmount,
      avgOrderValue,
      statusCounts,
      vendorCounts,
      recentOrders: data.slice(0, 10)
    };
  };

  // Process vendor analysis
  const processVendorAnalysis = (data) => {
    const vendorStats = data.reduce((acc, order) => {
      const vendor = order.vendor?.name || order.vendor_name || 'Unknown';
      const amount = parseFloat(order.totalAmount || order.total || 0);
      
      if (!acc[vendor]) {
        acc[vendor] = {
          name: vendor,
          totalOrders: 0,
          totalAmount: 0,
          avgOrderValue: 0,
          orders: []
        };
      }
      
      acc[vendor].totalOrders++;
      acc[vendor].totalAmount += amount;
      acc[vendor].orders.push(order);
      
      return acc;
    }, {});

    // Calculate averages
    Object.values(vendorStats).forEach(vendor => {
      vendor.avgOrderValue = vendor.totalAmount / vendor.totalOrders;
    });

    return {
      type: 'vendor-analysis',
      vendors: Object.values(vendorStats).sort((a, b) => b.totalAmount - a.totalAmount)
    };
  };

  // Process financial summary
  const processFinancialSummary = (data) => {
    const monthlyData = data.reduce((acc, order) => {
      const date = new Date(order.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!acc[monthKey]) {
        acc[monthKey] = {
          month: monthKey,
          orders: 0,
          amount: 0
        };
      }
      
      acc[monthKey].orders++;
      acc[monthKey].amount += parseFloat(order.totalAmount || order.total || 0);
      
      return acc;
    }, {});

    return {
      type: 'financial-summary',
      monthlyData: Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month)),
      totalAmount: data.reduce((sum, order) => sum + parseFloat(order.totalAmount || order.total || 0), 0),
      totalOrders: data.length
    };
  };

  // Process status report
  const processStatusReport = (data) => {
    const statusGroups = data.reduce((acc, order) => {
      const status = order.status || 'unknown';
      if (!acc[status]) {
        acc[status] = [];
      }
      acc[status].push(order);
      return acc;
    }, {});

    return {
      type: 'status-report',
      statusGroups,
      statusCounts: Object.keys(statusGroups).reduce((acc, status) => {
        acc[status] = statusGroups[status].length;
        return acc;
      }, {})
    };
  };

  // Process detailed list
  const processDetailedList = (data) => {
    return {
      type: 'detailed-list',
      orders: data.map(order => ({
        ...order,
        vendorName: order.vendor?.name || order.vendor_name || 'Unknown',
        formattedAmount: new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(order.totalAmount || order.total || 0),
        formattedDate: new Date(order.createdAt).toLocaleDateString()
      }))
    };
  };

  // Export report
  const exportReport = async (format, options) => {
    if (!reportData) {
      addNotification('warning', 'Please generate a report first');
      return;
    }

    setExportLoading(true);
    try {
      const processedData = reportExportService.processReportDataForExport(reportData, options);
      
      switch (format) {
        case 'excel':
          await reportExportService.exportToExcel(processedData, options);
          break;
        case 'pdf':
          await reportExportService.exportToPdf(processedData, options);
          break;
        case 'csv':
          await reportExportService.exportToCsv(processedData, options);
          break;
        default:
          break;
      }
      
      addNotification('success', `Report exported as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Export error:', error);
      addNotification('error', 'Failed to export report');
    } finally {
      setExportLoading(false);
    }
  };

  // Get unique vendors for filter
  const getUniqueVendors = () => {
    const vendors = new Set();
    purchaseOrders.forEach(order => {
      const vendor = order.vendor?.name || order.vendor_name;
      if (vendor) vendors.add(vendor);
    });
    return Array.from(vendors).sort();
  };

  // Get unique statuses for filter
  const getUniqueStatuses = () => {
    const statuses = new Set();
    purchaseOrders.forEach(order => {
      if (order.status) statuses.add(order.status);
    });
    return Array.from(statuses).sort();
  };

  // Handle filter application
  const handleApplyFilters = () => {
    generateReport();
  };

  return (
    <Container fluid className="report-generator">
      <Row className="mb-4">
        <Col>
          <Card className="border-0 shadow-sm report-card">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <h4 className="mb-1">Report Generator</h4>
                  <p className="text-muted mb-0">Generate comprehensive reports for {siteName}</p>
                </div>
                <div className="d-flex gap-2">
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    <FontAwesomeIcon icon={faFileAlt} className="me-2" />
                    {showFilters ? 'Hide' : 'Show'} Filters
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={generateReport}
                    disabled={loading || ordersLoading}
                  >
                    {loading ? (
                      <Spinner animation="border" size="sm" className="me-2" />
                    ) : (
                      <FontAwesomeIcon icon={faChartBar} className="me-2" />
                    )}
                    Generate Report
                  </Button>
                </div>
              </div>

              {/* Report Type Selection */}
              <Nav variant="pills" className="mb-3 report-nav">
                {reportTypes.map((report) => (
                  <Nav.Item key={report.id}>
                    <Nav.Link
                      active={activeReport === report.id}
                      onClick={() => setActiveReport(report.id)}
                      className="d-flex align-items-center gap-2"
                    >
                      <FontAwesomeIcon icon={report.icon} />
                      <div>
                        <div className="fw-semibold">{report.name}</div>
                        <small className="text-muted">{report.description}</small>
                      </div>
                    </Nav.Link>
                  </Nav.Item>
                ))}
              </Nav>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Filters Component */}
      <ReportFilters
        filters={filters}
        setFilters={setFilters}
        showFilters={showFilters}
        setShowFilters={setShowFilters}
        getUniqueVendors={getUniqueVendors}
        getUniqueStatuses={getUniqueStatuses}
        onApplyFilters={handleApplyFilters}
      />

      {/* Report Content */}
      {reportData && (
        <Row>
          <Col>
            <Card className="border-0 shadow-sm report-card">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="mb-0">
                    {reportTypes.find(r => r.id === activeReport)?.name} Report
                  </h5>
                  <div className="d-flex gap-2">
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      onClick={() => setShowPreview(true)}
                    >
                      <FontAwesomeIcon icon={faEye} className="me-2" />
                      Preview
                    </Button>
                    <ReportExport
                      reportData={reportData}
                      onExport={exportReport}
                      loading={exportLoading}
                      reportName={`${reportTypes.find(r => r.id === activeReport)?.name}_${siteName}`}
                    />
                  </div>
                </div>

                {/* Report Content Based on Type */}
                {renderReportContent(reportData)}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Preview Modal */}
      <Modal show={showPreview} onHide={() => setShowPreview(false)} size="xl" className="preview-modal">
        <Modal.Header closeButton>
          <Modal.Title>Report Preview</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {reportData && renderReportContent(reportData)}
        </Modal.Body>
      </Modal>
    </Container>
  );

  // Render report content based on type
  function renderReportContent(data) {
    switch (data.type) {
      case 'summary':
        return renderSummaryReport(data);
      case 'vendor-analysis':
        return renderVendorAnalysis(data);
      case 'financial-summary':
        return renderFinancialSummary(data);
      case 'status-report':
        return renderStatusReport(data);
      case 'detailed-list':
        return renderDetailedList(data);
      default:
        return <div>Report content not available</div>;
    }
  }

  // Render summary report
  function renderSummaryReport(data) {
    return (
      <div className="fade-in">
        <Row className="g-3 mb-4">
          <Col md={3}>
            <Card className="text-center metric-card">
              <Card.Body>
                <h3 className="text-primary">{data.totalOrders}</h3>
                <p className="text-muted mb-0">Total Orders</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center metric-card">
              <Card.Body>
                <h3 className="text-success">
                  ${data.totalAmount.toLocaleString()}
                </h3>
                <p className="text-muted mb-0">Total Amount</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center metric-card">
              <Card.Body>
                <h3 className="text-info">
                  ${data.avgOrderValue.toLocaleString()}
                </h3>
                <p className="text-muted mb-0">Average Order Value</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center metric-card">
              <Card.Body>
                <h3 className="text-warning">
                  {Object.keys(data.vendorCounts).length}
                </h3>
                <p className="text-muted mb-0">Unique Vendors</p>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Row className="g-3">
          <Col md={6}>
            <Card className="report-card">
              <Card.Header>Orders by Status</Card.Header>
              <Card.Body>
                <Table className="report-table">
                  <tbody>
                    {Object.entries(data.statusCounts).map(([status, count]) => (
                      <tr key={status}>
                        <td>
                          <Badge bg="secondary" className="status-badge">{status}</Badge>
                        </td>
                        <td className="text-end">{count}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </Col>
          <Col md={6}>
            <Card className="report-card">
              <Card.Header>Top Vendors</Card.Header>
              <Card.Body>
                <Table className="report-table">
                  <tbody>
                    {Object.entries(data.vendorCounts)
                      .sort((a, b) => b[1] - a[1])
                      .slice(0, 5)
                      .map(([vendor, count]) => (
                        <tr key={vendor}>
                          <td>{vendor}</td>
                          <td className="text-end">{count}</td>
                        </tr>
                      ))}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </div>
    );
  }

  // Render vendor analysis
  function renderVendorAnalysis(data) {
    return (
      <div className="fade-in">
        <Table responsive className="report-table">
          <thead>
            <tr>
              <th>Vendor</th>
              <th>Total Orders</th>
              <th>Total Amount</th>
              <th>Average Order Value</th>
            </tr>
          </thead>
          <tbody>
            {data.vendors.map((vendor, index) => (
              <tr key={index}>
                <td>{vendor.name}</td>
                <td>{vendor.totalOrders}</td>
                <td>${vendor.totalAmount.toLocaleString()}</td>
                <td>${vendor.avgOrderValue.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    );
  }

  // Render financial summary
  function renderFinancialSummary(data) {
    return (
      <div className="fade-in">
        <Row className="g-3 mb-4">
          <Col md={6}>
            <Card className="text-center metric-card">
              <Card.Body>
                <h3 className="text-success">
                  ${data.totalAmount.toLocaleString()}
                </h3>
                <p className="text-muted mb-0">Total Revenue</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={6}>
            <Card className="text-center metric-card">
              <Card.Body>
                <h3 className="text-primary">{data.totalOrders}</h3>
                <p className="text-muted mb-0">Total Orders</p>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Card className="report-card">
          <Card.Header>Monthly Trends</Card.Header>
          <Card.Body>
            <Table className="report-table">
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Orders</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {data.monthlyData.map((month, index) => (
                  <tr key={index}>
                    <td>{month.month}</td>
                    <td>{month.orders}</td>
                    <td>${month.amount.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      </div>
    );
  }

  // Render status report
  function renderStatusReport(data) {
    return (
      <div className="fade-in">
        <Row className="g-3 mb-4">
          {Object.entries(data.statusCounts).map(([status, count]) => (
            <Col md={3} key={status}>
              <Card className="text-center metric-card">
                <Card.Body>
                  <h3 className="text-primary">{count}</h3>
                  <p className="text-muted mb-0">
                    <Badge bg="secondary" className="status-badge">{status}</Badge>
                  </p>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>

        {Object.entries(data.statusGroups).map(([status, orders]) => (
          <Card key={status} className="mb-3 report-card">
            <Card.Header>
              <Badge bg="secondary" className="status-badge">{status}</Badge> - {orders.length} orders
            </Card.Header>
            <Card.Body>
              <Table size="sm" className="report-table">
                <thead>
                  <tr>
                    <th>PO Number</th>
                    <th>Vendor</th>
                    <th>Amount</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.slice(0, 5).map((order, index) => (
                    <tr key={index}>
                      <td>{order.poNumber}</td>
                      <td>{order.vendor?.name || order.vendor_name}</td>
                      <td>${(order.totalAmount || order.total || 0).toLocaleString()}</td>
                      <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              {orders.length > 5 && (
                <small className="text-muted">
                  Showing 5 of {orders.length} orders
                </small>
              )}
            </Card.Body>
          </Card>
        ))}
      </div>
    );
  }

  // Render detailed list
  function renderDetailedList(data) {
    return (
      <div className="fade-in">
        <Table responsive className="report-table">
          <thead>
            <tr>
              <th>PO Number</th>
              <th>Vendor</th>
              <th>Status</th>
              <th>Amount</th>
              <th>Date</th>
              <th>Items</th>
            </tr>
          </thead>
          <tbody>
            {data.orders.map((order, index) => (
              <tr key={index}>
                <td>{order.poNumber}</td>
                <td>{order.vendorName}</td>
                <td>
                  <Badge bg="secondary" className="status-badge">{order.status}</Badge>
                </td>
                <td>{order.formattedAmount}</td>
                <td>{order.formattedDate}</td>
                <td>{order.items?.length || 0}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    );
  }
};

export default ReportGenerator; 