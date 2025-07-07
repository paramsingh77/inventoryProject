export const suppliers = [
  {
    id: 1,
    name: 'Acme Supplies',
    email: 'orders@acme.com',
    phone: '(555) 123-4567',
    address: {
      street: '123 Supply Street',
      city: 'Business City',
      state: 'BS',
      zip: '12345',
      country: 'USA'
    }
  },
  {
    id: 2,
    name: 'Global Trading Co.',
    email: 'sales@globaltrade.com',
    phone: '(555) 987-6543',
    address: {
      street: '456 Trade Avenue',
      city: 'Commerce City',
      state: 'CC',
      zip: '67890',
      country: 'USA'
    }
  },
  {
    id: 3,
    name: 'Tech Parts Inc.',
    email: 'orders@techparts.com',
    phone: '(555) 456-7890',
    address: {
      street: '789 Tech Boulevard',
      city: 'Silicon Valley',
      state: 'SV',
      zip: '54321',
      country: 'USA'
    }
  }
];

export const products = [
  {
    id: '1',
    sku: 'LAP-MBP-M3',
    name: 'MacBook Pro',
    description: 'M3 Chip, 16GB RAM, 512GB SSD',
    price: 2300.00,
    category: 'Laptops',
    inStock: true
  },
  {
    id: '2',
    sku: 'MON-DELL-4K',
    name: 'Dell 27" 4K Monitor',
    description: 'UltraSharp, IPS Display',
    price: 350.00,
    category: 'Monitors',
    inStock: true
  },
  {
    id: '3',
    sku: 'SW-MS365-BUS',
    name: 'Microsoft 365',
    description: 'Business Plan (1 year)',
    price: 15.00,
    category: 'Software',
    inStock: true
  },
  {
    id: '4',
    sku: 'ACC-DOCK-USB',
    name: 'Lenovo Docking Station',
    description: 'USB-C Hub with HDMI',
    price: 75.00,
    category: 'Accessories',
    inStock: true
  }
];

export const purchaseOrders = [
  {
    id: 'PO-825635-199',
    poNumber: 'PO-825635-199',
    createdAt: '2025-03-04T10:30:00Z',
    vendor: {
      name: 'Global Trading Co.',
      contactPerson: 'John Smith',
      email: 'john@globaltrading.com',
      phone: '(555) 123-4567',
      address: {
        street: '123 Trading St',
        city: 'Commerce City',
        state: 'CA',
        zip: '90001'
      }
    },
    items: [
      {
        id: '1',
        sku: 'GT-001',
        name: 'Office Supplies',
        description: 'Premium quality office supplies',
        quantity: 10,
        unitPrice: 43.50,
        totalPrice: 435.00
      }
    ],
    subtotal: 435.00,
    tax: 43.50,
    taxRate: 10,
    shippingFees: 50.00,
    totalAmount: 435.00,
    status: 'pending_approval',
    paymentTerms: 'net30',
    deliveryDate: '2025-03-20',
    shippingTerms: 'FOB Destination',
    shippingMethod: 'Ground',
    termsAndConditions: 'Standard terms apply',
    companyName: 'AAM Inventory',
    companyAddress: '700 17th Street, Modesto, CA 95354',
    department: 'IT Department',
    requestedBy: 'IT Manager'
  }
]; 