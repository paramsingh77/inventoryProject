// Add tracking fields to purchase_orders table
const addOrderTrackingFields = `
  ALTER TABLE purchase_orders 
  ADD COLUMN IF NOT EXISTS tracking_number VARCHAR(255),
  ADD COLUMN IF NOT EXISTS shipping_status VARCHAR(50),
  ADD COLUMN IF NOT EXISTS current_location VARCHAR(255),
  ADD COLUMN IF NOT EXISTS estimated_delivery DATE,
  ADD COLUMN IF NOT EXISTS last_status_update TIMESTAMP,
  ADD COLUMN IF NOT EXISTS tracking_history JSONB;
`; 