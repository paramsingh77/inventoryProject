# Reactory Backend API

Backend service for the Reactory Inventory Management System.

## 🚀 Railway Deployment

This service is configured for deployment on Railway.app.

### Environment Variables Required

```bash
# Database
DATABASE_URL=postgresql://username:password@host:port/database

# Email Configuration
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true

# Security
JWT_SECRET=your-jwt-secret
SESSION_SECRET=your-session-secret
NODE_ENV=production

# Frontend URL
FRONTEND_URL=your-frontend-domain.railway.app

# Optional
BYPASS_AUTH=true
ENABLE_EMAIL_CHECKER=false
```

### Health Check

The service includes a health check endpoint at `/api/health` for Railway monitoring.

### API Endpoints

- `GET /` - API information
- `GET /api/health` - Health check
- `POST /api/send-otp` - Send OTP email
- `POST /api/verify-otp` - Verify OTP
- `POST /api/auth/login` - User login
- `GET /api/devices` - Get devices
- `POST /api/devices` - Create device
- And many more...

### Database

The service automatically runs migrations on startup to ensure the database schema is up to date.

### Email Service

Configured to use Gmail SMTP for sending emails. Requires app password for Gmail.

## Development

```bash
npm install
npm run dev
```

## Production

```bash
npm start
```

The service will automatically:
1. Connect to the database
2. Run migrations
3. Start the email processor
4. Listen on the PORT environment variable 