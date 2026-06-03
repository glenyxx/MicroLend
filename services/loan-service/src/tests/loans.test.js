const request  = require('supertest');
const app      = require('../index');
const { pool } = require('../db');
const jwt      = require('jsonwebtoken');
require('dotenv').config();

// Helper: create a JWT token for a fake user without hitting the DB
// This is the correct way to test protected routes in isolation
const makeToken = (role = 'borrower', userId = 99) =>
  jwt.sign(
    { userId, email: `${role}@test.com`, role, full_name: 'Test User' },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

beforeAll(async () => {
  await pool.query('DELETE FROM loans WHERE borrower_id = 99');
});

afterAll(async () => {
  await pool.query('DELETE FROM loans WHERE borrower_id = 99');
  await pool.end();
});

// APPLY 
describe('POST /api/loans/apply', () => {

  it('should create a loan application with valid data', async () => {
    const res = await request(app)
      .post('/api/loans/apply')
      .set('Authorization', `Bearer ${makeToken('borrower')}`)
      .send({
        amount:          500000,
        purpose:         'Buy stock for shop',
        duration_months: 12,
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.loan.status).toBe('applied');
    expect(parseFloat(res.body.loan.amount)).toBe(500000);
  });

  it('should reject a loan below the minimum amount', async () => {
    const res = await request(app)
      .post('/api/loans/apply')
      .set('Authorization', `Bearer ${makeToken('borrower')}`)
      .send({ amount: 1000, purpose: 'Too small', duration_months: 6 });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/50,000/);
  });

  it('should reject a loan above the maximum amount', async () => {
    const res = await request(app)
      .post('/api/loans/apply')
      .set('Authorization', `Bearer ${makeToken('borrower')}`)
      .send({ amount: 99000000, purpose: 'Too big', duration_months: 12 });

    expect(res.statusCode).toBe(400);
  });

  it('should reject a request with no token', async () => {
    const res = await request(app)
      .post('/api/loans/apply')
      .send({ amount: 500000, purpose: 'Test', duration_months: 6 });
    expect(res.statusCode).toBe(401);
  });
});

// STATUS TRANSITIONS 
describe('PATCH /api/loans/:id/status', () => {

  let loanId;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/loans/apply')
      .set('Authorization', `Bearer ${makeToken('borrower')}`)
      .send({ amount: 300000, purpose: 'Transition test', duration_months: 6 });
    loanId = res.body.loan.id;
  });

  it('should allow officer to move loan from applied to reviewing', async () => {
    const res = await request(app)
      .patch(`/api/loans/${loanId}/status`)
      .set('Authorization', `Bearer ${makeToken('officer', 1)}`)
      .send({ status: 'reviewing', officer_notes: 'Under review' });

    expect(res.statusCode).toBe(200);
    expect(res.body.loan.status).toBe('reviewing');
  });

  it('should block invalid transition: reviewing → disbursed', async () => {
    const res = await request(app)
      .patch(`/api/loans/${loanId}/status`)
      .set('Authorization', `Bearer ${makeToken('officer', 1)}`)
      .send({ status: 'disbursed' });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/Invalid transition/i);
  });

  it('should block a borrower from changing loan status', async () => {
    const res = await request(app)
      .patch(`/api/loans/${loanId}/status`)
      .set('Authorization', `Bearer ${makeToken('borrower')}`)
      .send({ status: 'approved' });

    expect(res.statusCode).toBe(403);
  });
});

// GET LOANS
describe('GET /api/loans', () => {

  it('should return only own loans for a borrower', async () => {
    const res = await request(app)
      .get('/api/loans')
      .set('Authorization', `Bearer ${makeToken('borrower', 99)}`);

    expect(res.statusCode).toBe(200);
    // All returned loans must belong to borrower_id 99
    res.body.loans.forEach(loan => {
      expect(loan.borrower_id).toBe(99);
    });
  });

  it('should return all loans for an officer', async () => {
    const res = await request(app)
      .get('/api/loans')
      .set('Authorization', `Bearer ${makeToken('officer', 1)}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('count');
  });
});