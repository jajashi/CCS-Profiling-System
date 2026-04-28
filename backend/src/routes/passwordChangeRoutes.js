const express = require('express');
const router = express.Router();
const {
  createRequest,
  getPendingRequests,
  approveRequest,
  rejectRequest,
  getMyRequests,
} = require('../controllers/passwordChangeController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(protect);

// User routes
router.post('/request', createRequest);
router.get('/my-requests', getMyRequests);

// Admin routes
router.get('/pending', adminOnly, getPendingRequests);
router.put('/:id/approve', adminOnly, approveRequest);
router.put('/:id/reject', adminOnly, rejectRequest);

module.exports = router;
