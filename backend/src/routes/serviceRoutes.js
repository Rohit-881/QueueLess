const express = require('express');
const router = express.Router();
const {
  getAllServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
} = require('../controllers/serviceController');
const { protect } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/role');

router.get('/', getAllServices);
router.get('/:id', getServiceById);

// Admin-only management
router.post('/', protect, requireAdmin, createService);
router.put('/:id', protect, requireAdmin, updateService);
router.delete('/:id', protect, requireAdmin, deleteService);

module.exports = router;
