const express = require('express');
const router = express.Router();
const {
  getQueueSummary,
  getQueueSessions,
  updateQueueStatus,
} = require('../controllers/queueController');
const { protect } = require('../middleware/auth');
const { requireStaffOrAdmin } = require('../middleware/role');

router.get('/:sessionId/summary', getQueueSummary);
router.get('/sessions', protect, requireStaffOrAdmin, getQueueSessions);
router.patch('/:sessionId/status', protect, requireStaffOrAdmin, updateQueueStatus);

module.exports = router;
