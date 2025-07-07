import React, { useState } from 'react';
import { Table, Form, InputGroup, Button, Pagination } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faSort, faSortUp, faSortDown } from '@fortawesome/free-solid-svg-icons';
import { motion } from 'framer-motion';

const DataTable = ({
    columns,
    data,
    searchable = true,
    sortable = true,
    selectable = true,
    pagination = true,
    itemsPerPage = 10,
    onRowSelect,
    onSort,
    onSearch,
    loading = false
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
    const [selectedRows, setSelectedRows] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);

    // Handle search
    const handleSearch = (e) => {
        const value = e.target.value;
        setSearchTerm(value);
        setCurrentPage(1);
        if (onSearch) {
            onSearch(value);
        }
    };

    // Handle sort
    const handleSort = (key) => {
        if (!sortable) return;

        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
        
        if (onSort) {
            onSort(key, direction);
        }
    };

    // Handle row selection
    const handleRowSelect = (id) => {
        if (!selectable) return;

        const newSelectedRows = selectedRows.includes(id)
            ? selectedRows.filter(rowId => rowId !== id)
            : [...selectedRows, id];
        
        setSelectedRows(newSelectedRows);
        
        if (onRowSelect) {
            onRowSelect(newSelectedRows);
        }
    };

    // Handle select all
    const handleSelectAll = (e) => {
        if (e.target.checked) {
            const allIds = data.map(item => item.id);
            setSelectedRows(allIds);
            if (onRowSelect) onRowSelect(allIds);
        } else {
            setSelectedRows([]);
            if (onRowSelect) onRowSelect([]);
        }
    };

    // Pagination
    const totalPages = Math.ceil(data.length / itemsPerPage);
    const paginatedData = pagination
        ? data.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
        : data;

    return (
        <div className="data-table-container">
            {/* Search Bar */}
            {searchable && (
                <div className="mb-4">
                    <InputGroup>
                        <InputGroup.Text>
                            <FontAwesomeIcon icon={faSearch} />
                        </InputGroup.Text>
                        <Form.Control
                            type="text"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={handleSearch}
                        />
                    </InputGroup>
                </div>
            )}

            {/* Table */}
            <div className="table-responsive">
                <Table hover className="align-middle">
                    <thead>
                        <tr>
                            {selectable && (
                                <th className="text-center" style={{ width: '40px' }}>
                                    <Form.Check
                                        type="checkbox"
                                        onChange={handleSelectAll}
                                        checked={selectedRows.length === data.length}
                                    />
                                </th>
                            )}
                            {columns.map((column) => (
                                <th
                                    key={column.key}
                                    onClick={() => handleSort(column.key)}
                                    style={{ 
                                        cursor: sortable ? 'pointer' : 'default',
                                        ...column.style
                                    }}
                                >
                                    <div className="d-flex align-items-center">
                                        {column.label}
                                        {sortable && (
                                            <span className="ms-2">
                                                {sortConfig.key === column.key ? (
                                                    <FontAwesomeIcon 
                                                        icon={sortConfig.direction === 'asc' ? faSortUp : faSortDown}
                                                        className="text-primary"
                                                    />
                                                ) : (
                                                    <FontAwesomeIcon icon={faSort} className="text-muted" />
                                                )}
                                            </span>
                                        )}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={columns.length + (selectable ? 1 : 0)} className="text-center py-5">
                                    <div className="spinner-border text-primary" role="status">
                                        <span className="visually-hidden">Loading...</span>
                                    </div>
                                </td>
                            </tr>
                        ) : paginatedData.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length + (selectable ? 1 : 0)} className="text-center py-5">
                                    No data available
                                </td>
                            </tr>
                        ) : (
                            paginatedData.map((item, index) => (
                                <motion.tr
                                    key={item.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3, delay: index * 0.05 }}
                                    onClick={() => handleRowSelect(item.id)}
                                    style={{ cursor: selectable ? 'pointer' : 'default' }}
                                >
                                    {selectable && (
                                        <td className="text-center">
                                            <Form.Check
                                                type="checkbox"
                                                checked={selectedRows.includes(item.id)}
                                                onChange={() => {}}
                                            />
                                        </td>
                                    )}
                                    {columns.map(column => (
                                        <td key={column.key}>
                                            {column.render ? column.render(item) : item[column.key]}
                                        </td>
                                    ))}
                                </motion.tr>
                            ))
                        )}
                    </tbody>
                </Table>
            </div>

            {/* Pagination */}
            {pagination && totalPages > 1 && (
                <div className="d-flex justify-content-between align-items-center mt-4">
                    <div>
                        Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, data.length)} of {data.length} entries
                    </div>
                    <Pagination className="mb-0">
                        <Pagination.First
                            onClick={() => setCurrentPage(1)}
                            disabled={currentPage === 1}
                        />
                        <Pagination.Prev
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                        />
                        {[...Array(totalPages)].map((_, index) => (
                            <Pagination.Item
                                key={index + 1}
                                active={currentPage === index + 1}
                                onClick={() => setCurrentPage(index + 1)}
                            >
                                {index + 1}
                            </Pagination.Item>
                        ))}
                        <Pagination.Next
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                        />
                        <Pagination.Last
                            onClick={() => setCurrentPage(totalPages)}
                            disabled={currentPage === totalPages}
                        />
                    </Pagination>
                </div>
            )}

            <style jsx="true">{`
                .data-table-container {
                    background: #fff;
                    border-radius: 0.5rem;
                    padding: 1.5rem;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
                }

                .table-responsive {
                    margin: 0 -1.5rem;
                    padding: 0 1.5rem;
                    overflow-x: auto;
                }

                .table th {
                    background: #f8f9fa;
                    padding: 1rem;
                    font-weight: 600;
                }

                .table td {
                    padding: 1rem;
                    vertical-align: middle;
                }

                /* Dark mode styles */
                .dark-mode .data-table-container {
                    background: #1a1a1a;
                }

                .dark-mode .table th {
                    background: #2a2a2a;
                    color: #fff;
                }

                .dark-mode .table td {
                    color: #fff;
                }

                .dark-mode .table-hover tbody tr:hover {
                    background-color: rgba(255, 255, 255, 0.05);
                }
            `}</style>
        </div>
    );
};

export default DataTable; 