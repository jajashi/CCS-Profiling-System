const express = require('express');
const router = express.Router();
const {
  getStudentsForReports,
  getStudentDossier,
  exportStudentProfilePDF,
  getFacultyForReports
} = require('../controllers/reportsController');
const { authenticate, requireRoles } = require('../middleware/authMiddleware');

// Apply authentication middleware to all routes
router.use(authenticate);

// Apply role-based access control - only Admin can access reports
router.use(requireRoles('admin'));

// GET /api/reports/students - Get students list for 360-degree reporting
router.get('/students', getStudentsForReports);

// GET /api/reports/students/:id/dossier - Get student 360-degree dossier
router.get('/students/:id/dossier', getStudentDossier);

// GET /api/reports/students/:id/export - Export student profile as PDF
router.get('/students/:id/export', exportStudentProfilePDF);

// GET /api/reports/faculty - Get faculty list for reporting
router.get('/faculty', getFacultyForReports);

module.exports = router;
