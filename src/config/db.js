import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Required for some hosted PostgreSQL providers
  }
});

export const db = {
  query: (text, params) => pool.query(text, params),
  getClient: () => pool.connect(),
}; 