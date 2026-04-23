const express = require('express');
const { getRecentActivities } = require('../controllers/dashboardController');
const { authenticate, requireRoles } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/activities', authenticate, requireRoles('admin', 'faculty'), getRecentActivities);

module.exports = router;
