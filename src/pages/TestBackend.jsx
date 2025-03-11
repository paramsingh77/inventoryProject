import React, { useState, useEffect } from 'react';
import { Container, Card, Button, Alert, Badge, Spinner, ListGroup, Table } from 'react-bootstrap';
import axios from 'axios';

// Possible backend URLs to test
const BACKEND_URLS = [
  'http://localhost:2000/api',  // Standard backend port
  'http://localhost:3001/api',  // Socket.io port
  'http://localhost:5000/api',  // Alternative port
  '/api'                        // Same-origin (via proxy)
];

const TestBackend = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [workingUrl, setWorkingUrl] = useState(null);
  const [testResults, setTestResults] = useState([]);
  const [error, setError] = useState(null);

  // Tests to run
  const TESTS = [
    {
      name: 'Health Check',
      endpoint: '/health',
      method: 'get',
      data: null,
      successMessage: 'Backend server is responding to health checks',
      failureMessage: 'Backend server health check failed'
    },
    {
      name: 'Test Upload',
      endpoint: '/email/test-upload',
      method: 'post',
      data: () => {
        // Create a minimal PDF blob
        const pdfContent = '%PDF-1.5\nTest PDF';
        const blob = new Blob([pdfContent], { type: 'application/pdf' });
        const file = new File([blob], 'test.pdf', { type: 'application/pdf' });
        
        const formData = new FormData();
        formData.append('pdfFile', file);
        formData.append('testField', 'test value');
        
        return formData;
      },
      headers: { 'Content-Type': 'multipart/form-data' },
      successMessage: 'File upload functionality works correctly',
      failureMessage: 'File upload test failed'
    }
  ];

  const findWorkingBackend = async () => {
    setLoading(true);
    setError(null);
    setWorkingUrl(null);
    setTestResults([]);
    
    try {
      for (const url of BACKEND_URLS) {
        try {
          // Try simple health check
          const response = await axios.get(`${url}/health`, { timeout: 3000 });
          if (response.status === 200) {
            setWorkingUrl(url);
            return url;
          }
        } catch (error) {
          console.log(`Failed to connect to ${url}: ${error.message}`);
        }
      }
      
      setError('No working backend found on any tested port');
      return null;
    } catch (error) {
      setError(`Error testing backends: ${error.message}`);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const runTest = async (url, test) => {
    try {
      const data = typeof test.data === 'function' ? test.data() : test.data;
      const config = {
        headers: test.headers || {},
        timeout: 5000 // 5 second timeout
      };
      
      const response = await axios[test.method](`${url}${test.endpoint}`, data, config);
      
      return { 
        name: test.name,
        success: true, 
        message: test.successMessage,
        response: response.data
      };
    } catch (error) {
      return {
        name: test.name,
        success: false,
        message: test.failureMessage,
        error: error.message
      };
    }
  };

  const runAllTests = async () => {
    if (!workingUrl) {
      const url = await findWorkingBackend();
      if (!url) return;
    }
    
    setLoading(true);
    const results = [];
    
    for (const test of TESTS) {
      const result = await runTest(workingUrl, test);
      results.push(result);
    }
    
    setTestResults(results);
    setLoading(false);
  };

  const fixBackendIssue = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Check if backend is running
      const running = await findWorkingBackend();
      
      if (!running) {
        setError('Backend is not running. Please start it with: cd backend && npm run dev');
        return;
      }
      
      // Suggest fixes based on test results
      if (testResults.some(test => !test.success)) {
        setError('Some tests failed. Please check the backend console for errors.');
      } else {
        setError(null);
      }
    } catch (error) {
      setError(`Error checking backend: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Run initial backend detection
  useEffect(() => {
    findWorkingBackend();
  }, []);

  return (
    <Container className="py-5">
      <Card className="shadow-sm">
        <Card.Header className="bg-primary text-white">
          <h2 className="mb-0">Backend Connection Diagnostics</h2>
        </Card.Header>
        <Card.Body>
          {error && (
            <Alert variant="danger">
              <i className="fas fa-exclamation-triangle me-2"></i>
              {error}
            </Alert>
          )}
          
          <div className="mb-4">
            <h4>Backend Status</h4>
            {loading ? (
              <div className="text-center py-3">
                <Spinner animation="border" variant="primary" />
                <p className="mt-2">Testing backend connections...</p>
              </div>
            ) : workingUrl ? (
              <Alert variant="success">
                <i className="fas fa-check-circle me-2"></i>
                Backend detected at: <strong>{workingUrl}</strong>
              </Alert>
            ) : (
              <Alert variant="warning">
                <i className="fas fa-exclamation-triangle me-2"></i>
                No backend detected. Please start the backend server.
              </Alert>
            )}
          </div>
          
          {workingUrl && (
            <div className="mb-4">
              <h4>Test Results</h4>
              {testResults.length > 0 ? (
                <Table striped bordered hover>
                  <thead>
                    <tr>
                      <th>Test</th>
                      <th>Status</th>
                      <th>Message</th>
                    </tr>
                  </thead>
                  <tbody>
                    {testResults.map((result, index) => (
                      <tr key={index}>
                        <td>{result.name}</td>
                        <td>
                          {result.success ? (
                            <Badge bg="success">PASS</Badge>
                          ) : (
                            <Badge bg="danger">FAIL</Badge>
                          )}
                        </td>
                        <td>{result.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <p>No tests have been run yet.</p>
              )}
            </div>
          )}
          
          <h4>Recommendations</h4>
          <ListGroup className="mb-4">
            <ListGroup.Item>
              <strong>Backend Server:</strong> Make sure it's running on port 2000
            </ListGroup.Item>
            <ListGroup.Item>
              <strong>Email Checker:</strong> Disable it by setting <code>ENABLE_EMAIL_CHECKER=false</code> in <code>.env</code>
            </ListGroup.Item>
            <ListGroup.Item>
              <strong>Backend Errors:</strong> Check the backend console for error messages
            </ListGroup.Item>
            <ListGroup.Item>
              <strong>Frontend Config:</strong> Ensure your <code>package.json</code> has the correct proxy setting
            </ListGroup.Item>
          </ListGroup>
          
          <div className="d-flex gap-2">
            <Button 
              variant="primary" 
              onClick={findWorkingBackend}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                  Checking...
                </>
              ) : (
                'Check Backend Connection'
              )}
            </Button>
            
            {workingUrl && (
              <Button 
                variant="success" 
                onClick={runAllTests}
                disabled={loading || !workingUrl}
              >
                {loading ? (
                  <>
                    <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                    Testing...
                  </>
                ) : (
                  'Run Diagnostic Tests'
                )}
              </Button>
            )}
            
            <Button 
              variant="secondary" 
              onClick={() => window.location.href = '/'}
            >
              Back to Application
            </Button>
          </div>
        </Card.Body>
        <Card.Footer className="bg-light">
          <small className="text-muted">
            If you're experiencing email-related errors, try editing your <code>.env</code> file 
            in the backend directory to set <code>ENABLE_EMAIL_CHECKER=false</code>
          </small>
        </Card.Footer>
      </Card>
    </Container>
  );
};

export default TestBackend; 