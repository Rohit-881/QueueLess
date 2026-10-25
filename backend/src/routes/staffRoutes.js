const express = require('express');
const router = express.Router();
const {
  getStaffDashboard,
  callNext,
  startService,
  completeService,
  skipToken,
  markNoShow,
} = require('../controllers/staffController');
const { protect } = require('../middleware/auth');
const { requireStaffOrAdmin } = require('../middleware/role');

// All staff routes require staff or admin privileges
router.use(protect, requireStaffOrAdmin);

router.get('/dashboard', getStaffDashboard);
router.post('/queues/:sessionId/call-next', callNext);
router.post('/tokens/:tokenId/start', startService);
router.post('/tokens/:tokenId/complete', completeService);
router.post('/tokens/:tokenId/skip', skipToken);
router.post('/tokens/:tokenId/no-show', markNoShow);

module.exports = router;
