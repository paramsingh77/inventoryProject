# Reactory Frontend

React frontend for the Reactory Inventory Management System.

## 🚀 Railway Deployment

This service is configured for deployment on Railway.app.

### Environment Variables Required

```bash
# Backend API URL
REACT_APP_API_URL=https://backendinventory-production.up.railway.app
REACT_APP_NODE_ENV=production
REACT_APP_BACKEND_URL=https://backendinventory-production.up.railway.app
```

### Build Process

The frontend will automatically:
1. Install dependencies
2. Build the production bundle
3. Serve the static files

### API Configuration

The frontend is configured to connect to the backend API at:
`https://backendinventory-production.up.railway.app`

### Features

- React 19 with modern hooks
- Material-UI and Ant Design components
- Real-time updates with Socket.IO
- Responsive design
- Authentication system
- Inventory management interface

## Development

```bash
npm install
npm start
```

## Production

```bash
npm run build
npm start
```

## Available Scripts

- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run tests
- `npm run eject` - Eject from Create React App

## Dependencies

- React 19
- Material-UI
- Ant Design
- Axios for API calls
- Socket.IO for real-time features
- React Router for navigation
