const express = require('express');
const router = express.Router();
const {
  getAnalytics,
  getStaffList,
  getAllUsers,
  updateUser,
  createUser,
  reseedData,
} = require('../controllers/analyticsController');
const { protect } = require('../middleware/auth');
const { requireStaffOrAdmin, requireAdmin } = require('../middleware/role');

router.use(protect);

router.get('/', requireStaffOrAdmin, getAnalytics);
router.get('/staff', requireAdmin, getStaffList);
router.get('/users', requireAdmin, getAllUsers);
router.post('/users', requireAdmin, createUser);
router.patch('/users/:id', requireAdmin, updateUser);
router.post('/reseed', requireAdmin, reseedData);

module.exports = router;
