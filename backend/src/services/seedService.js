const User = require('../models/User');
const Service = require('../models/Service');
const QueueSession = require('../models/QueueSession');
const Token = require('../models/Token');

/**
 * Reusable seeding logic for both CLI and Admin Dashboard reseed
 */
const runSeed = async () => {
  // Clear existing collections safely
  await Token.deleteMany({});
  await QueueSession.deleteMany({});
  await Service.deleteMany({});
  await User.deleteMany({});

  // 1. Create Users
  const adminPassword = await User.hashPassword('Admin@123');
  const staffPassword = await User.hashPassword('Staff@123');
  const customerPassword = await User.hashPassword('Customer@123');

  const admin = await User.create({
    name: 'System Administrator',
    email: 'admin@queueless.com',
    passwordHash: adminPassword,
    role: 'admin',
    isActive: true,
  });

  const staff1 = await User.create({
    name: 'Dr. Sarah Jenkins',
    email: 'staff.sarah@queueless.com',
    passwordHash: staffPassword,
    role: 'staff',
    isActive: true,
  });

  const staff2 = await User.create({
    name: 'Alex Vance (Officer)',
    email: 'staff.alex@queueless.com',
    passwordHash: staffPassword,
    role: 'staff',
    isActive: true,
  });

  const customer1 = await User.create({
    name: 'John Miller',
    email: 'john.customer@gmail.com',
    passwordHash: customerPassword,
    role: 'customer',
    isActive: true,
  });

  const customer2 = await User.create({
    name: 'Emma Watson',
    email: 'emma.customer@gmail.com',
    passwordHash: customerPassword,
    role: 'customer',
    isActive: true,
  });

  const customer3 = await User.create({
    name: 'David Clark',
    email: 'david.customer@gmail.com',
    passwordHash: customerPassword,
    role: 'customer',
    isActive: true,
  });

  // 2. Create Services
  const clinic = await Service.create({
    name: 'Campus Health Clinic (OPD)',
    description: 'General outpatient medical consultations, triage, first-aid, and prescription refills.',
    codePrefix: 'OPD',
    category: 'Healthcare',
    location: 'Building B, 1st Floor, Room 104',
    counterNumber: 'Counter 1',
    averageServiceDuration: 15,
    maximumQueueCapacity: 50,
    isActive: true,
    assignedStaff: [staff1._id],
  });

  const studentAdmin = await Service.create({
    name: 'Student Administration & Registrar',
    description: 'Document verification, transcript requests, migration certificates, and semester enrollment.',
    codePrefix: 'ADM',
    category: 'Education',
    location: 'Main Administrative Block, Ground Floor',
    counterNumber: 'Counter 2',
    averageServiceDuration: 10,
    maximumQueueCapacity: 60,
    isActive: true,
    assignedStaff: [staff2._id],
  });

  const finance = await Service.create({
    name: 'Finance & Fee Collection Desk',
    description: 'Tuition payment clearance, scholarship verification, and no-dues certificate signing.',
    codePrefix: 'FIN',
    category: 'Banking & Finance',
    location: 'Administrative Wing, Counter 3',
    counterNumber: 'Counter 3',
    averageServiceDuration: 8,
    maximumQueueCapacity: 40,
    isActive: true,
    assignedStaff: [staff2._id],
  });

  const library = await Service.create({
    name: 'Central Library Helpdesk',
    description: 'Book issuance, membership renewals, fine waivers, and digital repository access.',
    codePrefix: 'LIB',
    category: 'Other',
    location: 'Central Library, Reception Desk',
    counterNumber: 'Counter 4',
    averageServiceDuration: 5,
    maximumQueueCapacity: 30,
    isActive: true,
    assignedStaff: [],
  });

  // 3. Create Operating Queue Sessions for Today
  const today = new Date().toISOString().split('T')[0];

  const sessionClinic = await QueueSession.create({
    serviceId: clinic._id,
    businessDate: today,
    status: 'open',
    maximumCapacity: clinic.maximumQueueCapacity,
    lastSequence: 2,
    openedAt: new Date(Date.now() - 3600000 * 2),
  });

  const sessionAdmin = await QueueSession.create({
    serviceId: studentAdmin._id,
    businessDate: today,
    status: 'open',
    maximumCapacity: studentAdmin.maximumQueueCapacity,
    lastSequence: 5,
    openedAt: new Date(Date.now() - 3600000 * 3),
  });

  const sessionFinance = await QueueSession.create({
    serviceId: finance._id,
    businessDate: today,
    status: 'open',
    maximumCapacity: finance.maximumQueueCapacity,
    lastSequence: 0,
    openedAt: new Date(Date.now() - 3600000 * 1),
  });

  const sessionLibrary = await QueueSession.create({
    serviceId: library._id,
    businessDate: today,
    status: 'paused',
    maximumCapacity: library.maximumQueueCapacity,
    lastSequence: 0,
    openedAt: new Date(Date.now() - 3600000 * 1),
  });

  // 4. Create Seed Tokens
  // Clinic Tokens
  await Token.create({
    tokenNumber: 'OPD-001',
    queueSequence: 1,
    serviceId: clinic._id,
    queueSessionId: sessionClinic._id,
    userId: customer2._id,
    status: 'completed',
    joinedAt: new Date(Date.now() - 3600000 * 1.5),
    calledAt: new Date(Date.now() - 3600000 * 1.2),
    serviceStartedAt: new Date(Date.now() - 3600000 * 1.1),
    completedAt: new Date(Date.now() - 3600000 * 0.8),
    calledByStaffId: staff1._id,
  });

  await Token.create({
    tokenNumber: 'OPD-002',
    queueSequence: 2,
    serviceId: clinic._id,
    queueSessionId: sessionClinic._id,
    userId: customer3._id,
    status: 'waiting',
    joinedAt: new Date(Date.now() - 3600000 * 0.5),
  });

  // Admin Tokens
  await Token.create({
    tokenNumber: 'ADM-001',
    queueSequence: 1,
    serviceId: studentAdmin._id,
    queueSessionId: sessionAdmin._id,
    userId: customer1._id,
    status: 'completed',
    joinedAt: new Date(Date.now() - 3600000 * 2.5),
    calledAt: new Date(Date.now() - 3600000 * 2.2),
    serviceStartedAt: new Date(Date.now() - 3600000 * 2.1),
    completedAt: new Date(Date.now() - 3600000 * 1.8),
    calledByStaffId: staff2._id,
  });

  await Token.create({
    tokenNumber: 'ADM-002',
    queueSequence: 2,
    serviceId: studentAdmin._id,
    queueSessionId: sessionAdmin._id,
    userId: customer2._id,
    status: 'completed',
    joinedAt: new Date(Date.now() - 3600000 * 2.0),
    calledAt: new Date(Date.now() - 3600000 * 1.6),
    serviceStartedAt: new Date(Date.now() - 3600000 * 1.5),
    completedAt: new Date(Date.now() - 3600000 * 1.3),
    calledByStaffId: staff2._id,
  });

  const adm003 = await Token.create({
    tokenNumber: 'ADM-003',
    queueSequence: 3,
    serviceId: studentAdmin._id,
    queueSessionId: sessionAdmin._id,
    userId: customer1._id,
    status: 'serving',
    joinedAt: new Date(Date.now() - 3600000 * 1.2),
    calledAt: new Date(Date.now() - 3600000 * 0.3),
    serviceStartedAt: new Date(Date.now() - 3600000 * 0.2),
    calledByStaffId: staff2._id,
  });

  sessionAdmin.activeTokenId = adm003._id;
  await sessionAdmin.save();

  await Token.create({
    tokenNumber: 'ADM-004',
    queueSequence: 4,
    serviceId: studentAdmin._id,
    queueSessionId: sessionAdmin._id,
    userId: customer3._id,
    status: 'waiting',
    joinedAt: new Date(Date.now() - 3600000 * 0.4),
  });

  await Token.create({
    tokenNumber: 'ADM-005',
    queueSequence: 5,
    serviceId: studentAdmin._id,
    queueSessionId: sessionAdmin._id,
    userId: customer2._id,
    status: 'waiting',
    joinedAt: new Date(Date.now() - 3600000 * 0.2),
  });

  return {
    usersCreated: 6,
    servicesCreated: 4,
    sessionsCreated: 4,
    tokensCreated: 7,
  };
};

module.exports = { runSeed };
