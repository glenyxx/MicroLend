const { Pool } = require('pg');
require('dotenv').config();

// Pool = a group of reusable database connections
// Instead of opening a new connection for every request,
// we keep a pool of connections ready to use
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// Test the connection when the app starts
pool.connect((err, client, release) => {
  if (err) {
    console.error('Database connection failed:', err.message);
  } else {
    console.log('Connected to PostgreSQL');
    release(); // return this connection back to the pool
  }
});

const initDB = async () => {
  const createUsersTable = `
    CREATE TABLE IF NOT EXISTS users (
      id          SERIAL PRIMARY KEY,
      full_name   VARCHAR(100) NOT NULL,
      email       VARCHAR(150) UNIQUE NOT NULL,
      password    VARCHAR(255) NOT NULL,
      role        VARCHAR(20) NOT NULL DEFAULT 'borrower',
      created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  try {
    await pool.query(createUsersTable);
    console.log('Users table ready');
  } catch (err) {
    console.error('Failed to create users table:', err.message);
  }
};

module.exports = { pool, initDB };