const express = require('express');
const router = express.Router();
const {
  getOptions,
  getAllOptionsAdmin,
  createOption,
  updateOption,
  deleteOption,
} = require('../controllers/referenceOptionController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// Publicly available (authenticated) for fetching options in forms
router.get('/', protect, getOptions);

// Admin only management
router.get('/admin', protect, adminOnly, getAllOptionsAdmin);
router.post('/', protect, adminOnly, createOption);
router.put('/:id', protect, adminOnly, updateOption);
router.delete('/:id', protect, adminOnly, deleteOption);

module.exports = router;
