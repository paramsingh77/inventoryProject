import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faBoxes, 
    faChartLine, 
    faExclamationTriangle,
    faShoppingCart,
    faHistory,
    faPlus,
    faFileExport,
    faFileImport
} from '@fortawesome/free-solid-svg-icons';
import { useLocation, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import ProductList from '../components/Inventory/ProductList';
import ImportDevices from '../components/Inventory/ImportDevices';

const InventoryManagement = () => {
    const [selectedSite, setSelectedSite] = useState(null);
    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(true);
    const location = useLocation();
    const { siteName } = useParams();
    
    useEffect(() => {
        console.log("Route params siteName:", siteName);
        console.log("Location state:", location.state);
        
        // Method 1: Try to get site data from location state
        const siteData = location.state;
        
        if (siteData && siteData.siteName) {
            console.log("Using site data from location.state", siteData);
            setSelectedSite(siteData);
            fetchSiteInventory(siteData.siteName);
            
            // Store this site as the last selected one
            localStorage.setItem('lastSelectedSite', JSON.stringify({
                siteName: siteData.siteName,
                siteLocation: siteData.siteLocation || 'No location'
            }));
        } 
        // Method 2: Use the URL parameter if available
        else if (siteName) {
            console.log("Using siteName from URL:", siteName);
            const decodedSiteName = decodeURIComponent(siteName);
            
            // Check if we have this site in localStorage
            const lastSelectedSite = localStorage.getItem('lastSelectedSite');
            if (lastSelectedSite) {
                try {
                    const storedSiteData = JSON.parse(lastSelectedSite);
                    if (storedSiteData.siteName === decodedSiteName) {
                        setSelectedSite(storedSiteData);
                    } else {
                        setSelectedSite({ 
                            siteName: decodedSiteName,
                            siteLocation: 'Location not available'
                        });
                    }
                } catch (e) {
                    console.error("Error parsing stored site data:", e);
                    setSelectedSite({ 
                        siteName: decodedSiteName,
                        siteLocation: 'Location not available'
                    });
                }
            } else {
                setSelectedSite({ 
                    siteName: decodedSiteName,
                    siteLocation: 'Location not available'
                });
            }
            
            fetchSiteInventory(decodedSiteName);
        }
    }, [location, siteName]);

    const fetchSiteInventory = async (siteName) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:2000/api/devices/site/${siteName}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            const data = await response.json();
            setInventory(data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching inventory:', error);
            setLoading(false);
        }
    };

    const stats = [
        {
            title: 'Total Devices',
            value: inventory.length,
            icon: faBoxes,
            color: 'primary'
        },
        {
            title: 'Active Devices',
            value: inventory.filter(device => device.last_seen === 'Currently Online').length,
            icon: faChartLine,
            color: 'success'
        },
        {
            title: 'Offline Devices',
            value: inventory.filter(device => device.last_seen !== 'Currently Online').length,
            icon: faExclamationTriangle,
            color: 'danger'
        },
        {
            title: 'Pending Updates',
            value: '5',
            icon: faShoppingCart,
            color: 'warning'
        },
        {
            title: 'Recent Activity',
            value: '12',
            icon: faHistory,
            color: 'info'
        }
    ];

    return (
        <Container fluid className="py-4">
            {/* Header */}
            <Row className="mb-4 align-items-center">
                <Col>
                    <h4 className="mb-0">
                        <FontAwesomeIcon icon={faBoxes} className="me-2" />
                        {selectedSite?.siteName || 'Loading...'} - Device Inventory
                    </h4>
                    <p className="text-muted mb-0 mt-1">
                        Location: {selectedSite?.siteLocation || 'Location not available'}
                    </p>
                </Col>
                <Col xs="auto">
                    <div className="d-flex gap-2">
                        <Button variant="outline-secondary">
                            <FontAwesomeIcon icon={faFileExport} className="me-2" />
                            Export
                        </Button>
                        <ImportDevices onImportSuccess={() => {
                            if (selectedSite?.siteName) {
                                fetchSiteInventory(selectedSite.siteName);
                            }
                        }} />
                        <Button variant="primary">
                            <FontAwesomeIcon icon={faPlus} className="me-2" />
                            Add Device
                        </Button>
                    </div>
                </Col>
            </Row>

            {/* Stats Cards */}
            <Row className="g-4 mb-4">
                {stats.map((stat, index) => (
                    <Col key={index} md>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.1 }}
                        >
                            <Card className={`border-0 shadow-sm h-100`}>
                                <Card.Body>
                                    <div className="d-flex align-items-center">
                                        <div className={`rounded-3 p-3 bg-${stat.color} bg-opacity-10 me-3`}>
                                            <FontAwesomeIcon 
                                                icon={stat.icon} 
                                                className={`text-${stat.color}`} 
                                                size="lg"
                                            />
                                        </div>
                                        <div>
                                            <h6 className="text-muted mb-1">{stat.title}</h6>
                                            <h4 className="mb-0">{stat.value}</h4>
                                        </div>
                                    </div>
                                </Card.Body>
                            </Card>
                        </motion.div>
                    </Col>
                ))}
            </Row>

            {/* Product List Table */}
            <ProductList 
                devices={inventory}
                loading={loading}
                siteName={selectedSite?.siteName}
            />
        </Container>
    );
};

export default InventoryManagement; 