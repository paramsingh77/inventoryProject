import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Button, Badge } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faPlus, 
    faFileExport, 
    faFileImport,
    faCircle,
    faEdit,
    faTrash
} from '@fortawesome/free-solid-svg-icons';
import { motion } from 'framer-motion';
import DataTable from '../../components/Common/DataTable';
import MainLayout from '../../components/Layout/MainLayout';

const DevicesPage = () => {
    const [devices, setDevices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDevices, setSelectedDevices] = useState([]);

    useEffect(() => {
        fetchDevices();
    }, []);

    const fetchDevices = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:2000/api/devices/all', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch devices');
            }

            const data = await response.json();
            setDevices(data);
        } catch (error) {
            console.error('Error fetching devices:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        const statusColors = {
            'active': 'success',
            'inactive': 'danger',
            'maintenance': 'warning'
        };

        return (
            <Badge bg={statusColors[status.toLowerCase()] || 'secondary'} className="d-flex align-items-center gap-1">
                <FontAwesomeIcon icon={faCircle} className="small" />
                {status}
            </Badge>
        );
    };

    const columns = [
        {
            key: 'device_hostname',
            label: 'Hostname',
            style: { minWidth: '180px' }
        },
        {
            key: 'site_name',
            label: 'Site',
            style: { minWidth: '150px' }
        },
        {
            key: 'device_type',
            label: 'Type',
            style: { minWidth: '120px' }
        },
        {
            key: 'operating_system',
            label: 'OS',
            style: { minWidth: '150px' }
        },
        {
            key: 'last_seen',
            label: 'Last Seen',
            style: { minWidth: '150px' }
        },
        {
            key: 'status',
            label: 'Status',
            style: { minWidth: '120px' },
            render: (item) => getStatusBadge(item.status)
        },
        {
            key: 'actions',
            label: 'Actions',
            style: { width: '100px' },
            render: (item) => (
                <div className="d-flex gap-2">
                    <Button variant="outline-primary" size="sm" title="Edit">
                        <FontAwesomeIcon icon={faEdit} />
                    </Button>
                    <Button variant="outline-danger" size="sm" title="Delete">
                        <FontAwesomeIcon icon={faTrash} />
                    </Button>
                </div>
            )
        }
    ];

    const handleSearch = (searchTerm) => {
        // Implement search logic here
        console.log('Searching for:', searchTerm);
    };

    const handleSort = (key, direction) => {
        // Implement sort logic here
        console.log('Sorting by:', key, direction);
    };

    const handleRowSelect = (selectedIds) => {
        setSelectedDevices(selectedIds);
    };

    return (
        <MainLayout>
            <Container fluid>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    {/* Header */}
                    <Row className="mb-4 align-items-center">
                        <Col>
                            <h1 className="h3 mb-0">Devices</h1>
                        </Col>
                        <Col xs="auto">
                            <div className="d-flex gap-2">
                                <Button variant="outline-secondary">
                                    <FontAwesomeIcon icon={faFileExport} className="me-2" />
                                    Export
                                </Button>
                                <Button variant="outline-secondary">
                                    <FontAwesomeIcon icon={faFileImport} className="me-2" />
                                    Import
                                </Button>
                                <Button variant="primary">
                                    <FontAwesomeIcon icon={faPlus} className="me-2" />
                                    Add Device
                                </Button>
                            </div>
                        </Col>
                    </Row>

                    {/* Stats */}
                    <Row className="g-4 mb-4">
                        {[
                            { label: 'Total Devices', value: devices.length, color: 'primary' },
                            { label: 'Active', value: devices.filter(d => d.status === 'active').length, color: 'success' },
                            { label: 'Inactive', value: devices.filter(d => d.status === 'inactive').length, color: 'danger' },
                            { label: 'Maintenance', value: devices.filter(d => d.status === 'maintenance').length, color: 'warning' }
                        ].map((stat, index) => (
                            <Col key={index} md={3}>
                                <motion.div
                                    className={`bg-${stat.color} bg-opacity-10 rounded-3 p-4`}
                                    whileHover={{ scale: 1.02 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <h3 className={`h2 mb-1 text-${stat.color}`}>{stat.value}</h3>
                                    <p className="text-muted mb-0">{stat.label}</p>
                                </motion.div>
                            </Col>
                        ))}
                    </Row>

                    {/* Data Table */}
                    <DataTable
                        columns={columns}
                        data={devices}
                        loading={loading}
                        onSearch={handleSearch}
                        onSort={handleSort}
                        onRowSelect={handleRowSelect}
                    />
                </motion.div>
            </Container>
        </MainLayout>
    );
};

export default DevicesPage; 