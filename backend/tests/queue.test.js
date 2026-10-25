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
const Service = require('../src/models/Service');
const QueueSession = require('../src/models/QueueSession');
const Token = require('../src/models/Token');

describe('Queue Business Logic & State Machine Suite', () => {
  let adminToken;
  let staffToken;
  let customerToken;
  let customer2Token;
  let testService;
  let testSession;
  let createdTokenId;

  before(async () => {
    await connectDB();

    // Clean any previous test artifacts
    await User.deleteMany({ email: /^queue\.test/ });

    // Login admin
    const adminLogin = await request(app).post('/api/auth/login').send({
      email: 'admin@queueless.com',
      password: 'Admin@123',
    });
    adminToken = adminLogin.body.token;

    // Login staff
    const staffLogin = await request(app).post('/api/auth/login').send({
      email: 'staff.sarah@queueless.com',
      password: 'Staff@123',
    });
    staffToken = staffLogin.body.token;

    // Register 2 test customers
    const c1 = await request(app).post('/api/auth/register').send({
      name: 'Queue Test User 1',
      email: 'queue.test1@queueless.test',
      password: 'Password@123',
    });
    customerToken = c1.body.token;

    const c2 = await request(app).post('/api/auth/register').send({
      name: 'Queue Test User 2',
      email: 'queue.test2@queueless.test',
      password: 'Password@123',
    });
    customer2Token = c2.body.token;

    // Create an isolated test service
    testService = await Service.create({
      name: 'Test Diagnostic Counter',
      codePrefix: 'TST',
      description: 'Automated test suite diagnostic counter',
      location: 'Lab Room 9',
      averageServiceDuration: 5,
      maximumQueueCapacity: 20,
      isActive: true,
    });

    // Create active queue session for test
    testSession = await QueueSession.create({
      serviceId: testService._id,
      businessDate: new Date().toISOString().split('T')[0],
      status: 'open',
      maximumCapacity: 20,
      lastSequence: 0,
      openedAt: new Date(),
    });
  });

  after(async () => {
    if (testService) {
      await Token.deleteMany({ serviceId: testService._id });
      await QueueSession.deleteMany({ serviceId: testService._id });
      await Service.deleteOne({ _id: testService._id });
    }
    await User.deleteMany({ email: /^queue\.test/ });
    await mongoose.disconnect();
  });

  it('1. Customer can join queue and receive formatted token', async () => {
    const res = await request(app)
      .post('/api/tokens/join')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ serviceId: testService._id });

    assert.strictEqual(res.statusCode, 201);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.token.tokenNumber, 'TST-001');
    assert.strictEqual(res.body.token.status, 'waiting');
    assert.strictEqual(res.body.position, 1);
    assert.strictEqual(res.body.peopleAhead, 0);

    createdTokenId = res.body.token._id;
  });

  it('2. Prevents duplicate active token for same customer in same session', async () => {
    const res = await request(app)
      .post('/api/tokens/join')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ serviceId: testService._id });

    assert.strictEqual(res.statusCode, 409);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.code, 'DUPLICATE_ACTIVE_TOKEN');
  });

  it('3. Another customer can join and gets incremented sequence', async () => {
    const res = await request(app)
      .post('/api/tokens/join')
      .set('Authorization', `Bearer ${customer2Token}`)
      .send({ serviceId: testService._id });

    assert.strictEqual(res.statusCode, 201);
    assert.strictEqual(res.body.token.tokenNumber, 'TST-002');
    assert.strictEqual(res.body.position, 2);
    assert.strictEqual(res.body.peopleAhead, 1);
  });

  it('4. Staff / Admin can Call Next to claim earliest waiting token', async () => {
    const res = await request(app)
      .post(`/api/staff/queues/${testSession._id}/call-next`)
      .set('Authorization', `Bearer ${adminToken}`);

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.token.tokenNumber, 'TST-001');
    assert.strictEqual(res.body.token.status, 'called');
  });

  it('5. Rejects Call Next while previous token is still active (Counter Occupied)', async () => {
    const res = await request(app)
      .post(`/api/staff/queues/${testSession._id}/call-next`)
      .set('Authorization', `Bearer ${adminToken}`);

    assert.strictEqual(res.statusCode, 409);
    assert.strictEqual(res.body.code, 'COUNTER_OCCUPIED');
  });

  it('6. Rejects direct transition from called to completed (Must start service first)', async () => {
    const res = await request(app)
      .post(`/api/staff/tokens/${createdTokenId}/complete`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ resolutionReason: 'Done' });

    assert.strictEqual(res.statusCode, 400);
    assert.strictEqual(res.body.code, 'INVALID_STATUS_TRANSITION');
  });

  it('7. Transitions from called -> serving (Start Service)', async () => {
    const res = await request(app)
      .post(`/api/staff/tokens/${createdTokenId}/start`)
      .set('Authorization', `Bearer ${adminToken}`);

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.token.status, 'serving');
    assert.ok(res.body.token.serviceStartedAt);
  });

  it('8. Transitions from serving -> completed (Complete Service)', async () => {
    const res = await request(app)
      .post(`/api/staff/tokens/${createdTokenId}/complete`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ resolutionReason: 'Diagnostic test completed' });

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.token.status, 'completed');
    assert.ok(res.body.token.completedAt);
  });

  it('9. Cannot cancel a completed token', async () => {
    const res = await request(app)
      .post(`/api/tokens/${createdTokenId}/cancel`)
      .set('Authorization', `Bearer ${customerToken}`);

    assert.strictEqual(res.statusCode, 400);
    assert.strictEqual(res.body.code, 'CANCELLATION_NOT_ALLOWED');
  });
});
