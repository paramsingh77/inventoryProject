module.exports = {
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
  databaseUrl: process.env.DATABASE_URL,
  dbUser: process.env.DB_USER || 'postgres',
  dbHost: process.env.DB_HOST || 'localhost',
  dbName: process.env.DB_NAME || 'inventory_db',
  dbPassword: process.env.DB_PASSWORD || 'password',
  dbPort: process.env.DB_PORT || 5432,
}; 