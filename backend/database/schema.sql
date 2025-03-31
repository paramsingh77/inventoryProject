CREATE TABLE IF NOT EXISTS purchase_orders (
    id SERIAL PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ordered_by_id INTEGER REFERENCES users(id),
    ordered_by_name VARCHAR(100),
    expected_delivery DATE,
    status VARCHAR(20) DEFAULT 'pending',
    total_amount DECIMAL(10,2),
    notes TEXT,
    vendor_name VARCHAR(100),
    vendor_email VARCHAR(100),
    contact_person VARCHAR(100),
    phone_number VARCHAR(20),
    pdf_path VARCHAR(500),
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add index for faster status lookups
CREATE INDEX IF NOT EXISTS idx_po_status ON purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_po_created_at ON purchase_orders(created_at); 