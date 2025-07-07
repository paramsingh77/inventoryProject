import React from 'react';
import { Row, Col, Form, Button, Card, Badge } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilter, faTimes } from '@fortawesome/free-solid-svg-icons';

const ReportFilters = ({ 
  filters, 
  setFilters, 
  showFilters, 
  setShowFilters, 
  getUniqueVendors, 
  getUniqueStatuses,
  onApplyFilters 
}) => {
  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const clearFilters = () => {
    setFilters({
      dateRange: 'last30days',
      status: 'all',
      vendor: 'all',
      minAmount: '',
      maxAmount: '',
      startDate: '',
      endDate: ''
    });
  };

  const hasActiveFilters = () => {
    return filters.status !== 'all' || 
           filters.vendor !== 'all' || 
           filters.minAmount || 
           filters.maxAmount ||
           filters.dateRange === 'custom';
  };

  return (
    <Card className="border-0 shadow-sm mb-3">
      <Card.Body>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div className="d-flex align-items-center gap-2">
            <FontAwesomeIcon icon={faFilter} className="text-primary" />
            <h6 className="mb-0">Report Filters</h6>
            {hasActiveFilters() && (
              <Badge bg="primary" className="ms-2">
                Active
              </Badge>
            )}
          </div>
          <div className="d-flex gap-2">
            {hasActiveFilters() && (
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={clearFilters}
              >
                <FontAwesomeIcon icon={faTimes} className="me-1" />
                Clear
              </Button>
            )}
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              {showFilters ? 'Hide' : 'Show'} Filters
            </Button>
          </div>
        </div>

        {showFilters && (
          <div className="border-top pt-3">
            <Row className="g-3">
              <Col md={3}>
                <Form.Group>
                  <Form.Label>Date Range</Form.Label>
                  <Form.Select
                    value={filters.dateRange}
                    onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                  >
                    <option value="last7days">Last 7 Days</option>
                    <option value="last30days">Last 30 Days</option>
                    <option value="last90days">Last 90 Days</option>
                    <option value="thisYear">This Year</option>
                    <option value="custom">Custom Range</option>
                  </Form.Select>
                </Form.Group>
              </Col>

              {filters.dateRange === 'custom' && (
                <>
                  <Col md={2}>
                    <Form.Group>
                      <Form.Label>Start Date</Form.Label>
                      <Form.Control
                        type="date"
                        value={filters.startDate}
                        onChange={(e) => handleFilterChange('startDate', e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={2}>
                    <Form.Group>
                      <Form.Label>End Date</Form.Label>
                      <Form.Control
                        type="date"
                        value={filters.endDate}
                        onChange={(e) => handleFilterChange('endDate', e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                </>
              )}

              <Col md={filters.dateRange === 'custom' ? 2 : 3}>
                <Form.Group>
                  <Form.Label>Status</Form.Label>
                  <Form.Select
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                  >
                    <option value="all">All Statuses</option>
                    {getUniqueStatuses().map(status => (
                      <option key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col md={filters.dateRange === 'custom' ? 3 : 3}>
                <Form.Group>
                  <Form.Label>Vendor</Form.Label>
                  <Form.Select
                    value={filters.vendor}
                    onChange={(e) => handleFilterChange('vendor', e.target.value)}
                  >
                    <option value="all">All Vendors</option>
                    {getUniqueVendors().map(vendor => (
                      <option key={vendor} value={vendor}>{vendor}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col md={filters.dateRange === 'custom' ? 6 : 6}>
                <Form.Group>
                  <Form.Label>Amount Range ($)</Form.Label>
                  <div className="d-flex gap-2">
                    <Form.Control
                      type="number"
                      placeholder="Minimum amount"
                      value={filters.minAmount}
                      onChange={(e) => handleFilterChange('minAmount', e.target.value)}
                    />
                    <Form.Control
                      type="number"
                      placeholder="Maximum amount"
                      value={filters.maxAmount}
                      onChange={(e) => handleFilterChange('maxAmount', e.target.value)}
                    />
                  </div>
                </Form.Group>
              </Col>
            </Row>

            <div className="d-flex justify-content-end mt-3">
              <Button
                variant="primary"
                size="sm"
                onClick={onApplyFilters}
              >
                Apply Filters
              </Button>
            </div>
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default ReportFilters; 