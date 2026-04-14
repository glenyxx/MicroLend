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
    console.error('❌ Repayments DB connection failed:', err.message);
  } else {
    console.log('✅ Connected to Repayments PostgreSQL');
    release();
  }
});

const initDB = async () => {
  // Table 1: one row per approved loan — the overall schedule header
  const createSchedulesTable = `
    CREATE TABLE IF NOT EXISTS repayment_schedules (
      id                  SERIAL PRIMARY KEY,
      loan_id             INTEGER UNIQUE NOT NULL,
      borrower_id         INTEGER NOT NULL,
      borrower_email      VARCHAR(150) NOT NULL,
      borrower_name       VARCHAR(100) NOT NULL,
      principal_amount    NUMERIC(12,2) NOT NULL,
      interest_rate       NUMERIC(6,4) NOT NULL,
      duration_months     INTEGER NOT NULL,
      monthly_instalment  NUMERIC(12,2) NOT NULL,
      total_repayable     NUMERIC(12,2) NOT NULL,
      total_interest      NUMERIC(12,2) NOT NULL,
      status              VARCHAR(20) NOT NULL DEFAULT 'active',
      created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  // Table 2: one row per monthly instalment — tracks every due date and payment
  const createInstalmentsTable = `
    CREATE TABLE IF NOT EXISTS repayment_instalments (
      id           SERIAL PRIMARY KEY,
      schedule_id  INTEGER NOT NULL REFERENCES repayment_schedules(id),
      loan_id      INTEGER NOT NULL,
      instalment_number  INTEGER NOT NULL,
      due_date     DATE NOT NULL,
      amount_due   NUMERIC(12,2) NOT NULL,
      amount_paid  NUMERIC(12,2) DEFAULT 0,
      status       VARCHAR(20) NOT NULL DEFAULT 'pending',
      paid_at      TIMESTAMP,
      notes        TEXT,
      created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  try {
    await pool.query(createSchedulesTable);
    await pool.query(createInstalmentsTable);
    console.log('✅ Repayment tables ready');
  } catch (err) {
    console.error('❌ Failed to create repayment tables:', err.message);
  }
};

module.exports = { pool, initDB };