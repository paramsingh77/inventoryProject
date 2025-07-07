import React from 'react';
import { Nav, Tab } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileInvoice } from '@fortawesome/free-solid-svg-icons';
import InvoicesList from '../Invoices/InvoicesList';

const InvoiceRoutes = () => {
  return (
    <div className="container-fluid p-0">
      <Tab.Container defaultActiveKey="invoices">
        <Nav variant="tabs" className="mb-4 border-bottom">
          <Nav.Item>
            <Nav.Link eventKey="invoices" className="d-flex align-items-center">
              <FontAwesomeIcon icon={faFileInvoice} className="me-2" />
              Invoices
            </Nav.Link>
          </Nav.Item>
        </Nav>
        
        <Tab.Content>
          <Tab.Pane eventKey="invoices">
            <InvoicesList />
          </Tab.Pane>
        </Tab.Content>
      </Tab.Container>
    </div>
  );
};

export default InvoiceRoutes; 