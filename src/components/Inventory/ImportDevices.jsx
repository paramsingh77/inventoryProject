import React, { useState } from 'react';
import { Form, Button, Alert, Spinner, Modal } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileImport } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

const ImportDevices = ({ onImportSuccess }) => {
    const [showModal, setShowModal] = useState(false);
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    const handleClose = () => {
        setShowModal(false);
        setFile(null);
        setError(null);
        setSuccess(null);
    };

    const handleShow = () => setShowModal(true);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile && (selectedFile.type === 'text/csv' || selectedFile.name.endsWith('.csv'))) {
            setFile(selectedFile);
            setError(null);
        } else {
            setError('Please select a valid CSV file');
            setFile(null);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file) {
            setError('Please select a file to import');
            return;
        }

        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await axios.post('/api/devices/import', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            if (response.data.success) {
                setSuccess(response.data.message);
                setFile(null);
                // Reset file input
                e.target.reset();
                // Trigger parent refresh
                if (onImportSuccess) {
                    onImportSuccess();
                }
                // Close modal after successful import
                setTimeout(() => {
                    handleClose();
                }, 2000);
            } else {
                setError(response.data.error || 'Import failed');
            }
        } catch (error) {
            console.error('Import error:', error);
            setError(error.response?.data?.error || 'Error importing devices');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Button 
                variant="outline-secondary" 
                onClick={handleShow}
                className="d-flex align-items-center"
            >
                <FontAwesomeIcon icon={faFileImport} className="me-2" />
                Import
            </Button>

            <Modal show={showModal} onHide={handleClose} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Import Devices</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={handleSubmit}>
                        <Form.Group className="mb-3">
                            <Form.Label>Select CSV File</Form.Label>
                            <Form.Control 
                                type="file" 
                                accept=".csv"
                                onChange={handleFileChange}
                                isInvalid={!!error}
                            />
                            <Form.Text className="text-muted">
                                Please upload a CSV file containing device information
                            </Form.Text>
                        </Form.Group>

                        <AnimatePresence>
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                >
                                    <Alert variant="danger" className="mb-3">
                                        {error}
                                    </Alert>
                                </motion.div>
                            )}

                            {success && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                >
                                    <Alert variant="success" className="mb-3">
                                        {success}
                                    </Alert>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="d-flex justify-content-end gap-2">
                            <Button 
                                variant="secondary" 
                                onClick={handleClose}
                                disabled={loading}
                            >
                                Cancel
                            </Button>
                            <Button 
                                type="submit" 
                                variant="primary"
                                disabled={!file || loading}
                            >
                                {loading ? (
                                    <>
                                        <Spinner
                                            as="span"
                                            animation="border"
                                            size="sm"
                                            role="status"
                                            aria-hidden="true"
                                            className="me-2"
                                        />
                                        Importing...
                                    </>
                                ) : (
                                    'Import Devices'
                                )}
                            </Button>
                        </div>
                    </Form>
                </Modal.Body>
            </Modal>
        </>
    );
};

export default ImportDevices; 