require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: false
});

const testSuppliers = [
    {
        name: 'Tech Solutions Inc.',
        contact_person: 'John Smith',
        email: 'john.smith@techsolutions.com',
        phone: '555-0123',
        address: '123 Tech Street, Silicon Valley, CA 94025',
        website: 'www.techsolutions.com',
        tax_id: 'TS123456789',
        payment_terms: 'Net 30',
        status: 'active',
        notes: 'Primary supplier for computer hardware'
    },
    {
        name: 'Office Supplies Pro',
        contact_person: 'Sarah Johnson',
        email: 'sarah.j@officesuppliespro.com',
        phone: '555-0124',
        address: '456 Supply Ave, Business District, NY 10001',
        website: 'www.officesuppliespro.com',
        tax_id: 'OS987654321',
        payment_terms: 'Net 60',
        status: 'active',
        notes: 'Reliable supplier for office equipment'
    },
    {
        name: 'Network Systems Ltd',
        contact_person: 'Mike Wilson',
        email: 'mike.w@networksystems.com',
        phone: '555-0125',
        address: '789 Network Lane, Tech Park, TX 75001',
        website: 'www.networksystems.com',
        tax_id: 'NS456789123',
        payment_terms: 'Net 30',
        status: 'active',
        notes: 'Specialized in networking equipment'
    }
];

async function seedSuppliers() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Clear existing suppliers
        await client.query('DELETE FROM suppliers');

        // Insert test suppliers
        for (const supplier of testSuppliers) {
            await client.query(`
                INSERT INTO suppliers (
                    name, contact_person, email, phone, address,
                    website, tax_id, payment_terms, status, notes
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
                )
            `, [
                supplier.name,
                supplier.contact_person,
                supplier.email,
                supplier.phone,
                supplier.address,
                supplier.website,
                supplier.tax_id,
                supplier.payment_terms,
                supplier.status,
                supplier.notes
            ]);
        }

        await client.query('COMMIT');
        console.log('Database seeded with test suppliers successfully');
        process.exit(0);
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error seeding database:', error);
        process.exit(1);
    } finally {
        client.release();
    }
}

seedSuppliers(); 