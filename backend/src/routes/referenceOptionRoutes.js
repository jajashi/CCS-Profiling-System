const express = require('express');
const router = express.Router();
const {
  getOptions,
  getAllOptionsAdmin,
  createOption,
  updateOption,
  deleteOption,
} = require('../controllers/referenceOptionController');
const { authenticate, requireRoles } = require('../middleware/authMiddleware');

// Publicly available (authenticated) for fetching options in forms
router.get('/', authenticate, getOptions);

// Admin only management
router.get('/admin', authenticate, requireRoles('admin'), getAllOptionsAdmin);
router.post('/', authenticate, requireRoles('admin'), createOption);
router.put('/:id', authenticate, requireRoles('admin'), updateOption);
router.delete('/:id', authenticate, requireRoles('admin'), deleteOption);

module.exports = router;
