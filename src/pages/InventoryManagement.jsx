import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEdit, faTrash, faBoxes } from '@fortawesome/free-solid-svg-icons';
import { useLocation, useNavigate } from 'react-router-dom';

const InventoryManagement = () => {
    const [selectedSite, setSelectedSite] = useState(null);
    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        // Get selected site from localStorage
        const site = JSON.parse(localStorage.getItem('selectedSite'));
        setSelectedSite(site);
        
        // TODO: Fetch inventory for this specific site
        // This will be replaced with actual API call
        fetchSiteInventory(site.Name);
    }, []);

    const fetchSiteInventory = async (siteName) => {
        try {
            // TODO: Replace with actual API call
            const response = await fetch(`/api/inventory/${siteName}`);
            const data = await response.json();
            setInventory(data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching inventory:', error);
            setLoading(false);
        }
    };

    return (
        <Container fluid className="py-4">
            <Row className="mb-4">
                <Col>
                    <h4 className="mb-3">
                        <FontAwesomeIcon icon={faBoxes} className="me-2" />
                        Inventory Management - {selectedSite?.Name}
                    </h4>
                    <p className="text-muted">
                        Location: {selectedSite?.Location || 'Location not available'}
                    </p>
                </Col>
                <Col xs="auto">
                    <Button variant="primary">
                        <FontAwesomeIcon icon={faPlus} className="me-2" />
                        Add New Item
                    </Button>
                </Col>
            </Row>

            <Card>
                <Card.Body>
                    <Table responsive hover>
                        <thead>
                            <tr>
                                <th>Item Code</th>
                                <th>Name</th>
                                <th>Category</th>
                                <th>Quantity</th>
                                <th>Unit</th>
                                <th>Last Updated</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {/* Sample inventory data - will be replaced with actual data */}
                            <tr>
                                <td>MED001</td>
                                <td>Surgical Masks</td>
                                <td>PPE</td>
                                <td>1000</td>
                                <td>pieces</td>
                                <td>2024-03-15</td>
                                <td>
                                    <span className="badge bg-success">In Stock</span>
                                </td>
                                <td>
                                    <Button variant="light" size="sm" className="me-2">
                                        <FontAwesomeIcon icon={faEdit} />
                                    </Button>
                                    <Button variant="light" size="sm" className="text-danger">
                                        <FontAwesomeIcon icon={faTrash} />
                                    </Button>
                                </td>
                            </tr>
                        </tbody>
                    </Table>
                </Card.Body>
            </Card>
        </Container>
    );
};

export default InventoryManagement; 