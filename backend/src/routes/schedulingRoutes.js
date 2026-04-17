const express = require('express');
const { listSections } = require('../controllers/schedulingController');
const { authenticate, requireRoles } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/sections', authenticate, requireRoles('admin', 'faculty'), listSections);

module.exports = router;
