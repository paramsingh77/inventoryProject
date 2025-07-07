import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faBoxes, 
    faChartLine, 
    faExclamationTriangle,
    faShoppingCart,
    faHistory,
    faPlus,
    faFileExport
} from '@fortawesome/free-solid-svg-icons';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import ProductList from '../components/Inventory/ProductList';
import ImportDevices from '../components/Inventory/ImportDevices';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import api from '../api/api-es';
import SiteOrders from '../components/Orders/SiteOrders';

const InventoryManagement = () => {
    const [selectedSite, setSelectedSite] = useState(null);
    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(true);
    const location = useLocation();
    const { siteName } = useParams();
    const [deviceStats, setDeviceStats] = useState({
        total: 0,
        active: 0,
        offline: 0,
        pending: 0,
        recent: 0
    });
    const { user } = useAuth();
    const { addNotification } = useNotification();
    const navigate = useNavigate();
    
    // Update fetchInventoryData to accept the site name parameter
    const fetchInventoryData = async (siteNameParam) => {
        const siteToUse = siteNameParam || selectedSite?.siteName;
        
        if (!siteToUse) {
            console.error("No site name provided for inventory fetch");
            setLoading(false);
            return;
        }
        
        try {
            console.log(`Fetching inventory for site: ${siteToUse}`);
            const response = await api.get(`/api/devices/site/${siteToUse}/devices`);
            console.log("Inventory response:", response.data);
            
            // Handle both possible response formats
            if (Array.isArray(response.data)) {
                setInventory(response.data);
            } else if (response.data && Array.isArray(response.data.devices)) {
                setInventory(response.data.devices);
            } else {
                setInventory([]);
                console.warn("Unexpected response format:", response.data);
            }
            
            setLoading(false);
        } catch (error) {
            console.error('Error fetching inventory data:', error);
            setLoading(false);
        }
    };
    
    // Similarly update fetchDeviceStats
    const fetchDeviceStats = async (siteNameParam) => {
        const siteToUse = siteNameParam || selectedSite?.siteName;
        
        if (!siteToUse) {
            return;
        }
        
        try {
            const response = await api.get(`/api/devices/site-stats/${siteToUse}`);
            if (response.data) {
                setDeviceStats(response.data);
            }
        } catch (error) {
            console.error('Error fetching device stats:', error);
        }
    };
    
    // Process site name from URL parameters
    useEffect(() => {
        console.log("Route params siteName:", siteName);
        console.log("Location state:", location.state);
        
        if (siteName) {
            const decodedSiteName = decodeURIComponent(siteName);
            console.log("Decoded site name:", decodedSiteName);
            
            setSelectedSite({ 
                siteName: decodedSiteName,
                siteLocation: 'Modesto' // Or get this from your data
            });
            
            // Don't fetch data here - it will use the old state value
        }
    }, [location, siteName]);
    
    // Fetch data when selectedSite changes
    useEffect(() => {
        if (selectedSite?.siteName) {
            console.log("Selected site changed:", selectedSite.siteName);
            fetchInventoryData(selectedSite.siteName);
            fetchDeviceStats(selectedSite.siteName);
        }
    }, [selectedSite, fetchInventoryData, fetchDeviceStats]);

    // Permission check
    useEffect(() => {
        // If not admin and site doesn't match assigned site, redirect
        if (
            siteName && 
            user && 
            user.role !== 'admin' && 
            user.assigned_site !== siteName
        ) {
            addNotification('error', 'You do not have access to this site');
            navigate('/inventory');
        }
    }, [siteName, user, navigate, addNotification]);

    const stats = [
        {
            title: 'Total Devices',
            value: deviceStats.total,
            icon: faBoxes,
            color: 'primary'
        },
        {
            title: 'Active Devices',
            value: deviceStats.active,
            icon: faChartLine,
            color: 'success'
        },
        {
            title: 'Offline Devices',
            value: deviceStats.offline,
            icon: faExclamationTriangle,
            color: 'danger'
        },
        {
            title: 'Pending Updates',
            value: deviceStats.pending,
            icon: faShoppingCart,
            color: 'warning'
        },
        {
            title: 'Recent Activity',
            value: deviceStats.recent,
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
                                fetchInventoryData();
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
            {/* <Row className="g-4 mb-4">
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
            </Row> */}

            {/* Product List Table */}
            <ProductList 
                devices={inventory}
                loading={loading}
                siteName={selectedSite?.siteName}
                data={inventory}
            />

            {/* Site Orders Component */}
            {/* <Route path="orders" element={<SiteOrders siteName={siteName} />} /> */}
        </Container>
    );
};

export default InventoryManagement; 