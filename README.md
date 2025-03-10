# Email-Based Purchase Order & Invoice Workflow

This project implements an end-to-end email-based workflow for purchase orders and invoices. The system allows you to:

1. Generate and send purchase order PDFs to vendors via email
2. Automatically receive and process invoice PDFs from vendor replies
3. Link invoices to their corresponding purchase orders
4. View and manage all invoices in the application

## Features

- **Send POs via Email**: Generate PDF purchase orders and email them to vendors
- **Automatic Email Checking**: Backend service that periodically checks for new invoice emails
- **PDF Processing**: Extract and store invoice PDFs from email attachments
- **PO Reference Extraction**: Automatically extract PO references from email subjects
- **Invoice Management**: View, download, and link invoices to purchase orders

## How It Works

### Sending Purchase Orders

1. Create a purchase order in the application
2. Click the "Send PO to Vendor" button
3. A PDF is generated with the PO details
4. The PDF is sent to the vendor via email with instructions to reply to `invoices@yourcompany.com`

### Receiving Invoices

1. Vendor receives PO email and responds with an invoice PDF
2. The backend service checks the dedicated email inbox every 5 minutes
3. When a new email with PDF attachment is found:
   - The PDF is saved to the server
   - PO reference is extracted from the email subject
   - A new invoice record is created in the database
   - If PO reference is found, the invoice is automatically linked

### Viewing Invoices

1. Navigate to the Invoices section in the application
2. View a list of all received invoices with their status
3. Click on an invoice to view details and download the PDF
4. Manually link invoices to POs if they weren't automatically linked

## Technologies Used

### Frontend
- React.js with Bootstrap for UI
- Framer Motion for animations
- Axios for API requests

### Backend
- Node.js with Express
- Nodemailer for sending emails
- IMAP for receiving emails
- PDFKit for generating PDF documents
- File system for storing PDFs

## Setup

### Email Configuration

To use the email functionality, you need to configure the following environment variables:

```
EMAIL_USER=invoices@yourcompany.com
EMAIL_PASS=your-email-password
EMAIL_HOST=smtp.yourcompany.com
IMAP_HOST=imap.yourcompany.com
EMAIL_CHECK_INTERVAL=300000
```

### Development

1. Install backend dependencies:
```
cd backend
npm install
```

2. Install frontend dependencies:
```
cd ../src
npm install
```

3. Start the backend server:
```
cd ../backend
npm run dev
```

4. Start the frontend development server:
```
cd ../src
npm start
```

## Notes

- For production use, ensure you use proper email authentication (OAuth2 is recommended)
- The system currently uses basic file storage. For production, consider using cloud storage solutions like AWS S3
- Email checking interval can be adjusted via environment variables
