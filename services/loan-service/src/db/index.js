const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host:     process.env.DB_HOST,
  port:     process.env.DB_PORT,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

pool.connect((err, client, release) => {
  if (err) {
    console.error('Loans DB connection failed:', err.message);
  } else {
    console.log('Connected to Loans PostgreSQL');
    release();
  }
});

const initDB = async () => {
  const createLoansTable = `
    CREATE TABLE IF NOT EXISTS loans (
      id              SERIAL PRIMARY KEY,
      borrower_id     INTEGER NOT NULL,
      borrower_name   VARCHAR(100) NOT NULL,
      borrower_email  VARCHAR(150) NOT NULL,
      amount          NUMERIC(12, 2) NOT NULL,
      purpose         VARCHAR(255) NOT NULL,
      duration_months INTEGER NOT NULL,
      status          VARCHAR(20) NOT NULL DEFAULT 'applied',
      officer_notes   TEXT,
      applied_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  // valid_transitions table enforces which status changes are legal
  // e.g. you cannot go from 'applied' directly to 'disbursed'
  const createTransitionsTable = `
    CREATE TABLE IF NOT EXISTS valid_transitions (
      from_status  VARCHAR(20),
      to_status    VARCHAR(20),
      PRIMARY KEY (from_status, to_status)
    );

    INSERT INTO valid_transitions (from_status, to_status) VALUES
      ('applied',   'reviewing'),
      ('reviewing', 'approved'),
      ('reviewing', 'rejected'),
      ('approved',  'disbursed')
    ON CONFLICT DO NOTHING;
  `;

  try {
    await pool.query(createLoansTable);
    await pool.query(createTransitionsTable);
    console.log('Loans tables ready');
  } catch (err) {
    console.error('Failed to create loans tables:', err.message);
  }
};

module.exports = { pool, initDB };