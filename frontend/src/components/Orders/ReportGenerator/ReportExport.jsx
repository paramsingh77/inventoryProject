import React, { useState } from 'react';
import { Button, Dropdown, Modal, Form, Spinner } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faDownload, 
  faFileExcel, 
  faFilePdf, 
  faFileCsv,
  faCog,
  faPrint
} from '@fortawesome/free-solid-svg-icons';

const ReportExport = ({ 
  reportData, 
  onExport, 
  loading = false,
  reportName = 'Report'
}) => {
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportOptions, setExportOptions] = useState({
    format: 'excel',
    includeCharts: true,
    includeSummary: true,
    includeDetails: true,
    fileName: `${reportName}_${new Date().toISOString().split('T')[0]}`
  });

  const exportFormats = [
    {
      id: 'excel',
      name: 'Excel (.xlsx)',
      icon: faFileExcel,
      description: 'Best for data analysis and calculations'
    },
    {
      id: 'pdf',
      name: 'PDF (.pdf)',
      icon: faFilePdf,
      description: 'Best for sharing and printing'
    },
    {
      id: 'csv',
      name: 'CSV (.csv)',
      icon: faFileCsv,
      description: 'Best for data import to other systems'
    }
  ];

  const handleExport = (format) => {
    if (format === 'custom') {
      setShowExportModal(true);
    } else {
      onExport(format, exportOptions);
    }
  };

  const handleCustomExport = () => {
    onExport(exportOptions.format, exportOptions);
    setShowExportModal(false);
  };

  const quickExport = (format) => {
    onExport(format, {
      ...exportOptions,
      format,
      fileName: `${reportName}_${format.toUpperCase()}_${new Date().toISOString().split('T')[0]}`
    });
  };

  return (
    <>
      <div className="d-flex gap-2">
        {/* Quick Export Buttons */}
        <Button
          variant="outline-success"
          size="sm"
          onClick={() => quickExport('excel')}
          disabled={loading || !reportData}
          className="export-btn"
        >
          {loading ? (
            <Spinner animation="border" size="sm" className="me-2" />
          ) : (
            <FontAwesomeIcon icon={faFileExcel} className="me-2" />
          )}
          Excel
        </Button>

        <Button
          variant="outline-danger"
          size="sm"
          onClick={() => quickExport('pdf')}
          disabled={loading || !reportData}
          className="export-btn"
        >
          {loading ? (
            <Spinner animation="border" size="sm" className="me-2" />
          ) : (
            <FontAwesomeIcon icon={faFilePdf} className="me-2" />
          )}
          PDF
        </Button>

        <Button
          variant="outline-info"
          size="sm"
          onClick={() => quickExport('csv')}
          disabled={loading || !reportData}
          className="export-btn"
        >
          {loading ? (
            <Spinner animation="border" size="sm" className="me-2" />
          ) : (
            <FontAwesomeIcon icon={faFileCsv} className="me-2" />
          )}
          CSV
        </Button>

        {/* Advanced Export Dropdown */}
        <Dropdown>
          <Dropdown.Toggle variant="outline-secondary" size="sm">
            <FontAwesomeIcon icon={faCog} className="me-2" />
            Advanced
          </Dropdown.Toggle>
          <Dropdown.Menu>
            <Dropdown.Header>Export Options</Dropdown.Header>
            <Dropdown.Item onClick={() => setShowExportModal(true)}>
              <FontAwesomeIcon icon={faDownload} className="me-2" />
              Custom Export
            </Dropdown.Item>
            <Dropdown.Divider />
            <Dropdown.Item onClick={() => window.print()}>
              <FontAwesomeIcon icon={faPrint} className="me-2" />
              Print Report
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      </div>

      {/* Custom Export Modal */}
      <Modal show={showExportModal} onHide={() => setShowExportModal(false)} className="export-modal">
        <Modal.Header closeButton>
          <Modal.Title>Custom Export Options</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Export Format</Form.Label>
              <div className="d-flex gap-2">
                {exportFormats.map((format) => (
                  <div
                    key={format.id}
                    className={`border rounded p-3 export-format-option ${
                      exportOptions.format === format.id ? 'selected' : ''
                    }`}
                    onClick={() => setExportOptions(prev => ({ ...prev, format: format.id }))}
                    style={{ cursor: 'pointer', flex: 1 }}
                  >
                    <div className="text-center">
                      <FontAwesomeIcon 
                        icon={format.icon} 
                        className={`mb-2 ${exportOptions.format === format.id ? 'text-primary' : 'text-muted'}`}
                        size="lg"
                      />
                      <div className="fw-semibold">{format.name}</div>
                      <small className="text-muted">{format.description}</small>
                    </div>
                  </div>
                ))}
              </div>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>File Name</Form.Label>
              <Form.Control
                type="text"
                value={exportOptions.fileName}
                onChange={(e) => setExportOptions(prev => ({ ...prev, fileName: e.target.value }))}
                placeholder="Enter file name"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Export Options</Form.Label>
              <div>
                <Form.Check
                  type="checkbox"
                  label="Include Summary"
                  checked={exportOptions.includeSummary}
                  onChange={(e) => setExportOptions(prev => ({ 
                    ...prev, 
                    includeSummary: e.target.checked 
                  }))}
                />
                <Form.Check
                  type="checkbox"
                  label="Include Charts"
                  checked={exportOptions.includeCharts}
                  onChange={(e) => setExportOptions(prev => ({ 
                    ...prev, 
                    includeCharts: e.target.checked 
                  }))}
                />
                <Form.Check
                  type="checkbox"
                  label="Include Detailed Data"
                  checked={exportOptions.includeDetails}
                  onChange={(e) => setExportOptions(prev => ({ 
                    ...prev, 
                    includeDetails: e.target.checked 
                  }))}
                />
              </div>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowExportModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleCustomExport}
            disabled={loading}
          >
            {loading ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Exporting...
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faDownload} className="me-2" />
                Export
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default ReportExport; 