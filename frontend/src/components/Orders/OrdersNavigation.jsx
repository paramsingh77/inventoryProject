import React from 'react';
import { Nav } from 'react-bootstrap';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

const OrdersNavigation = () => {
    const navigate = useNavigate();
    const location = useLocation();

    return (
        <Nav 
            variant="tabs" 
            className="mb-4"
            activeKey={location.pathname}
        >
            <Nav.Item>
                <motion.div
                    whileHover={{ y: -2 }}
                    whileTap={{ y: 0 }}
                >
                    <Nav.Link 
                        onClick={() => navigate('/orders')}
                        active={location.pathname === '/orders'}
                    >
                        Purchase Orders
                    </Nav.Link>
                </motion.div>
            </Nav.Item>
            <Nav.Item>
                <motion.div
                    whileHover={{ y: -2 }}
                    whileTap={{ y: 0 }}
                >
                    <Nav.Link 
                        onClick={() => navigate('/invoices')}
                        active={location.pathname.includes('/invoices')}
                    >
                        Invoices
                    </Nav.Link>
                </motion.div>
            </Nav.Item>
        </Nav>
    );
};

export default OrdersNavigation; 