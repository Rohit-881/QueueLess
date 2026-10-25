const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

const app = require('../src/app');
const connectDB = require('../src/config/db');
const User = require('../src/models/User');

describe('Authentication & Authorization Suite', () => {
  before(async () => {
    await connectDB();
    await User.deleteMany({ email: /^test\.customer/ });
  });

  after(async () => {
    await User.deleteMany({ email: /^test\.customer/ });
    await mongoose.disconnect();
  });

  const testUser = {
    name: 'Test Customer',
    email: 'test.customer@queueless.test',
    password: 'Password@123',
  };

  it('1. Successfully registers a customer and issues token', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    assert.strictEqual(res.statusCode, 201);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.user.id);
    assert.strictEqual(res.body.user.role, 'customer');
    assert.ok(res.body.token);
  });

  it('2. Prevents duplicate email registration', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    assert.strictEqual(res.statusCode, 409);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.code, 'DUPLICATE_EMAIL');
  });

  it('3. Rejects login with wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: 'WrongPassword',
      });

    assert.strictEqual(res.statusCode, 401);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.code, 'INVALID_CREDENTIALS');
  });

  it('4. Successfully logs in with correct password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      });

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.token);
    assert.strictEqual(res.body.user.email, testUser.email);
  });

  it('5. Denies customer access to administrator-only endpoint', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      });

    const token = loginRes.body.token;

    const res = await request(app)
      .get('/api/analytics/users')
      .set('Authorization', `Bearer ${token}`);

    assert.strictEqual(res.statusCode, 403);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.code, 'FORBIDDEN');
  });
});
