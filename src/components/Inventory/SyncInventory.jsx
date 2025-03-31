import React, { useState } from 'react';
import { Button, Modal, Spinner } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSync } from '@fortawesome/free-solid-svg-icons';
import api from '../../utils/api';
import SupplierService from '../../services/SupplierService';

const SyncInventory = ({ onSyncComplete }) => {
    const [showModal, setShowModal] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [syncResult, setSyncResult] = useState(null);
    const [error, setError] = useState(null);

    const handleSync = async () => {
        try {
            setSyncing(true);
            setError(null);
            
            const result = await SupplierService.syncFromInventory();
            console.log('Sync successful:', result);
            
            setSyncResult(result.summary);
            
            if (onSyncComplete) {
                onSyncComplete(result);
            }
            
        } catch (err) {
            console.error('Sync error:', err);
            let errorMessage = 'Failed to sync suppliers from inventory.';
            
            if (err.message) {
                errorMessage += ` Error: ${err.message}`;
            }
            
            setError(errorMessage);
        } finally {
            setSyncing(false);
        }
    };

    return (
        <>
            <Button 
                variant="primary" 
                onClick={() => setShowModal(true)}
                className="d-flex align-items-center gap-2"
            >
                <FontAwesomeIcon icon={faSync} />
                Sync from Inventory
            </Button>

            <Modal show={showModal} onHide={() => setShowModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Sync Inventory</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {syncing ? (
                        <div className="text-center py-4">
                            <Spinner animation="border" variant="primary" />
                            <p className="mt-2">Syncing inventory data...</p>
                        </div>
                    ) : error ? (
                        <div className="text-danger">{error}</div>
                    ) : syncResult ? (
                        <div>
                            <h6>Sync Complete!</h6>
                            <p>Total Vendors: {syncResult.totalVendors}</p>
                            <div className="mt-3">
                                <h6>Vendor Summary:</h6>
                                <div className="table-responsive">
                                    <table className="table table-sm">
                                        <thead>
                                            <tr>
                                                <th>Vendor</th>
                                                <th>Devices</th>
                                                <th>Types</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {syncResult.vendorDetails.map((vendor, index) => (
                                                <tr key={index}>
                                                    <td>{vendor.vendor}</td>
                                                    <td>{vendor.device_count}</td>
                                                    <td>{vendor.device_types}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            <p className="text-muted mt-2">
                                Last Synced: {new Date(syncResult.lastSynced).toLocaleString()}
                            </p>
                        </div>
                    ) : (
                        <p>Click Sync to update vendor data from inventory.</p>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowModal(false)}>
                        Close
                    </Button>
                    {!syncing && !syncResult && (
                        <Button variant="primary" onClick={handleSync}>
                            Start Sync
                        </Button>
                    )}
                    {syncResult && (
                        <Button variant="success" onClick={() => setShowModal(false)}>
                            Done
                        </Button>
                    )}
                </Modal.Footer>
            </Modal>
        </>
    );
};

export default SyncInventory; 