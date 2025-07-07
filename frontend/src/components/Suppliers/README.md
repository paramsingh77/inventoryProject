# Supplier Management Module

This module provides comprehensive supplier management capabilities for the Reactory application.

## Components

### AddSupplier
Allows users to add new suppliers with detailed information including:
- Company information (name, website, industry)
- Contact details (email, phone, address)
- Payment terms and tax information
- Status tracking

### SupplierList
Displays all suppliers with:
- Filtering and sorting capabilities
- Quick status view
- Options to edit, delete, or view detailed supplier information
- Search functionality

### SupplierContracts (Coming Soon)
Will provide functionality to:
- Track supplier contracts and agreements
- Manage contract terms and renewal dates
- Monitor compliance and obligations

### SupplierPerformance (Coming Soon)
Will track key supplier metrics:
- On-time delivery rates
- Quality ratings
- Response times
- Issue resolution

### SupplierTransactions (Coming Soon)
Will offer:
- Transaction history tracking
- Payment monitoring
- Spend analytics

### SupplierDocuments (Coming Soon)
Will provide:
- Document storage for supplier-related files
- Contract document management
- Certificate tracking
- Invoice storage

## Usage

The Supplier Management module is accessible from the main navigation. The main page displays:
1. Key statistics about suppliers
2. Navigation cards to access different supplier management functions
3. Quick access to add new suppliers

## Integration

This module integrates with:
- Purchase Order system for tracking supplier orders
- Financial systems for payment processing
- Document management for storing supplier-related files

## Styling

All components use:
- Bootstrap for responsive layouts and UI components
- Framer Motion for smooth animations and transitions
- FontAwesome icons for visual elements

## Data Management

Supplier data is managed through the SupplierService, which provides methods for:
- Creating new suppliers
- Retrieving supplier information
- Updating supplier details
- Deleting suppliers
- Filtering and searching supplier data 