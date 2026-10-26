const express = require('express');
const router = express.Router();
const {
  joinQueue,
  getMyActiveToken,
  getMyTokenHistory,
  getTokenById,
  cancelToken,
  createWalkInToken,
} = require('../controllers/tokenController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

router.post('/join', protect, authorize('customer', 'staff', 'admin'), joinQueue);
router.post('/walk-in', protect, authorize('staff', 'admin'), createWalkInToken);
router.get('/my-active', protect, getMyActiveToken);
router.get('/my-history', protect, getMyTokenHistory);
router.get('/:id', protect, getTokenById);
router.post('/:id/cancel', protect, cancelToken);

module.exports = router;
