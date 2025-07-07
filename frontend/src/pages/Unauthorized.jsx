import React from 'react';
import { Container, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const Unauthorized = () => {
  return (
    <Container className="text-center py-5">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="display-1 fw-bold text-danger">403</h1>
        <h2 className="mb-4">Access Denied</h2>
        <p className="lead mb-5">
          You don't have permission to access this page.
          Please contact your administrator if you believe this is an error.
        </p>
        <Button as={Link} to="/" variant="primary" size="lg">
          Go to Homepage
        </Button>
      </motion.div>
    </Container>
  );
};

export default Unauthorized; 