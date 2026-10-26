const http = require('http');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = require('./app');
const connectDB = require('./config/db');
const { initSocket } = require('./sockets/socketHandler');
const User = require('./models/User');
const { runSeed } = require('./services/seedService');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // 1. Connect to Database
    await connectDB();

    // 1b. Auto-seed if database is freshly created / empty
    try {
      const userCount = await User.countDocuments();
      if (userCount === 0) {
        console.log('[Auto-Seed] Empty database detected. Seeding initial demo services and accounts...');
        await runSeed();
        console.log('[Auto-Seed] Seeding completed successfully!');
      }
    } catch (seedErr) {
      console.warn('[Auto-Seed Warning] Could not auto-seed database:', seedErr.message);
    }

    // 2. Create HTTP Server
    const server = http.createServer(app);

    // 3. Attach Socket.IO
    initSocket(server);

    // 4. Start listening
    server.listen(PORT, () => {
      console.log(`===============================================`);
      console.log(` QueueLess Server running on port ${PORT}`);
      console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(` Health check: http://localhost:${PORT}/api/health`);
      console.log(` Socket.IO: Real-Time Engine Active`);
      console.log(`===============================================`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM signal received: closing HTTP server');
      server.close(() => {
        console.log('HTTP server closed');
      });
    });
  } catch (error) {
    console.error('Fatal Server Error:', error.message);
    process.exit(1);
  }
};

startServer();
