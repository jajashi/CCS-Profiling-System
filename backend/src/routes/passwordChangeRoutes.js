const express = require('express');
const router = express.Router();
const {
  createRequest,
  getPendingRequests,
  approveRequest,
  rejectRequest,
  getMyRequests,
} = require('../controllers/passwordChangeController');
const { authenticate, requireRoles } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(authenticate);

// User routes
router.post('/request', createRequest);
router.get('/my-requests', getMyRequests);

// Admin routes
router.get('/pending', requireRoles('admin'), getPendingRequests);
router.put('/:id/approve', requireRoles('admin'), approveRequest);
router.put('/:id/reject', requireRoles('admin'), rejectRequest);

module.exports = router;
