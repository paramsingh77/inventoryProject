-- First create a function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to create site-specific device inventory table
CREATE OR REPLACE FUNCTION create_site_device_table(site_name text) RETURNS void AS $$
BEGIN
    -- Create the site-specific device inventory table
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I_device_inventory (
            id SERIAL PRIMARY KEY,
            device_hostname VARCHAR(255),
            device_description TEXT,
            last_user VARCHAR(255),
            last_seen TIMESTAMP,
            device_type VARCHAR(100),
            device_model VARCHAR(255),
            operating_system VARCHAR(255),
            serial_number VARCHAR(255) UNIQUE,
            device_cpu VARCHAR(255),
            mac_addresses TEXT[],
            status VARCHAR(50) DEFAULT ''active'',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )', site_name);

    -- Create indexes
    EXECUTE format('
        CREATE INDEX IF NOT EXISTS %I_device_hostname_idx ON %I_device_inventory (device_hostname);
        CREATE INDEX IF NOT EXISTS %I_serial_number_idx ON %I_device_inventory (serial_number);
        CREATE INDEX IF NOT EXISTS %I_status_idx ON %I_device_inventory (status);
    ', site_name, site_name, site_name, site_name, site_name, site_name);

    -- Create trigger for updated_at
    EXECUTE format('
        DROP TRIGGER IF EXISTS update_%I_device_inventory_timestamp ON %I_device_inventory;
        CREATE TRIGGER update_%I_device_inventory_timestamp
        BEFORE UPDATE ON %I_device_inventory
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    ', site_name, site_name, site_name, site_name);
END;
$$ LANGUAGE plpgsql; 