const express = require('express');
const {
  getFaculty,
  getFacultyById,
  getNextFacultyIdPreview,
  createFaculty,
  updateFaculty,
  getFacultyAnalytics,
} = require('../controllers/facultyController');
const { authenticate, requireRoles } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', authenticate, requireRoles('admin', 'faculty'), getFaculty);
router.get('/analytics', authenticate, requireRoles('admin', 'faculty'), getFacultyAnalytics);
router.get('/:employeeId', authenticate, requireRoles('admin', 'faculty'), getFacultyById);
router.post('/', authenticate, requireRoles('admin'), createFaculty);
router.put('/:employeeId', authenticate, requireRoles('admin'), updateFaculty);

module.exports = router;
