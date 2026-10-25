const dotenv = require('dotenv');
dotenv.config();

const mongoose = require('mongoose');
const { runSeed } = require('./services/seedService');

const seedCLI = async () => {
  try {
    console.log('[Seed] Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('[Seed] Connected successfully.');

    console.log('[Seed] Seeding demo database...');
    const result = await runSeed();
    console.log('[Seed] Success:', result);

    console.log('\n======================================================');
    console.log('   QUEUELESS PLATFORM - DEMO ACCOUNTS READY FOR VIVA');
    console.log('======================================================');
    console.log(' 1. Administrator:');
    console.log('    Email:    admin@queueless.com');
    console.log('    Password: Admin@123\n');
    console.log(' 2. Staff Member (Campus Clinic OPD):');
    console.log('    Email:    staff.sarah@queueless.com');
    console.log('    Password: Staff@123\n');
    console.log(' 3. Staff Member (Student Admin):');
    console.log('    Email:    staff.alex@queueless.com');
    console.log('    Password: Staff@123\n');
    console.log(' 4. Customers:');
    console.log('    Email:    john.customer@gmail.com  (ADM-003 Serving)');
    console.log('    Email:    emma.customer@gmail.com  (ADM-005 Waiting)');
    console.log('    Email:    david.customer@gmail.com (ADM-004 Waiting)');
    console.log('    Password: Customer@123');
    console.log('======================================================\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('[Seed Error]:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  seedCLI();
}

module.exports = { seedCLI };
