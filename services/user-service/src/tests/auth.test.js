const request = require('supertest');
const app     = require('../index');
const { pool } = require('../db');

// This runs once before all tests in this file
// We clean the users table so tests are isolated and repeatable
beforeAll(async () => {
  await pool.query('DELETE FROM users WHERE email LIKE $1', ['%test_%']);
});

// This runs once after all tests — close the DB connection
// so Jest doesn't hang waiting for it
afterAll(async () => {
  await pool.query('DELETE FROM users WHERE email LIKE $1', ['%test_%']);
  await pool.end();
});

// ── REGISTER ─────────────────────────────────────────────────────────────────
describe('POST /api/users/register', () => {

  it('should register a new user and return a token', async () => {
    const res = await request(app)
      .post('/api/users/register')
      .send({
        full_name: 'Test User One',
        email:     'test_user1@example.com',
        password:  'TestPass123',
        role:      'borrower',
      });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.email).toBe('test_user1@example.com');
    expect(res.body.user.role).toBe('borrower');
    // CRITICAL: password must never appear in the response
    expect(res.body.user).not.toHaveProperty('password');
  });

  it('should reject registration with a duplicate email', async () => {
    // Register the same email twice
    await request(app).post('/api/users/register').send({
      full_name: 'Duplicate User',
      email:     'test_duplicate@example.com',
      password:  'TestPass123',
    });

    const res = await request(app).post('/api/users/register').send({
      full_name: 'Duplicate User Again',
      email:     'test_duplicate@example.com',
      password:  'AnotherPass123',
    });

    expect(res.statusCode).toBe(409);
    expect(res.body.error).toMatch(/already registered/i);
  });

  it('should reject registration with missing fields', async () => {
    const res = await request(app)
      .post('/api/users/register')
      .send({ email: 'test_missing@example.com' }); // no password or name

    expect(res.statusCode).toBe(400);
  });
});

// ── LOGIN ─────────────────────────────────────────────────────────────────────
describe('POST /api/users/login', () => {

  beforeAll(async () => {
    // Create a user to log in with
    await request(app).post('/api/users/register').send({
      full_name: 'Login Test User',
      email:     'test_login@example.com',
      password:  'LoginPass123',
    });
  });

  it('should login with correct credentials and return a token', async () => {
    const res = await request(app)
      .post('/api/users/login')
      .send({ email: 'test_login@example.com', password: 'LoginPass123' });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.email).toBe('test_login@example.com');
  });

  it('should reject login with wrong password', async () => {
    const res = await request(app)
      .post('/api/users/login')
      .send({ email: 'test_login@example.com', password: 'WrongPassword' });

    expect(res.statusCode).toBe(401);
  });

  it('should reject login with non-existent email', async () => {
    const res = await request(app)
      .post('/api/users/login')
      .send({ email: 'nobody@example.com', password: 'SomePass' });

    expect(res.statusCode).toBe(401);
  });
});

// ── PROFILE (protected route) ─────────────────────────────────────────────────
describe('GET /api/users/profile', () => {

  let token;

  beforeAll(async () => {
    // Register and immediately capture the token
    const res = await request(app).post('/api/users/register').send({
      full_name: 'Profile Test User',
      email:     'test_profile@example.com',
      password:  'ProfilePass123',
    });
    token = res.body.token;
  });

  it('should return user profile with a valid token', async () => {
    const res = await request(app)
      .get('/api/users/profile')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.user).toHaveProperty('email', 'test_profile@example.com');
  });

  it('should return 401 when no token is provided', async () => {
    const res = await request(app).get('/api/users/profile');
    expect(res.statusCode).toBe(401);
  });

  it('should return 401 with a fake token', async () => {
    const res = await request(app)
      .get('/api/users/profile')
      .set('Authorization', 'Bearer this.is.fake');
    expect(res.statusCode).toBe(401);
  });
});