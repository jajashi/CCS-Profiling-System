const express = require('express');
const { authenticate, requireRoles } = require('../middleware/authMiddleware');
const { listAdvisingNotes, createAdvisingNote } = require('../controllers/advisingController');

const router = express.Router();

router.get('/:sectionId', authenticate, requireRoles('admin', 'faculty'), listAdvisingNotes);
router.post('/:sectionId', authenticate, requireRoles('admin', 'faculty'), createAdvisingNote);

module.exports = router;
