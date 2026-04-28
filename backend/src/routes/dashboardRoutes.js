const express = require('express');
const { getRecentActivities, getAnalyticsSummary } = require('../controllers/dashboardController');
const { authenticate, requireRoles } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/activities', authenticate, requireRoles('admin', 'faculty'), getRecentActivities);
router.get('/analytics', authenticate, requireRoles('admin'), getAnalyticsSummary);

module.exports = router;
