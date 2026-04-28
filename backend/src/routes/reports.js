const express = require('express');
const router = express.Router();
const {
  getStudentsForReports,
  getStudentDossier,
  exportStudentProfilePDF
} = require('../controllers/reportsController');
const { authenticate, requireRoles } = require('../middleware/authMiddleware');

// Apply authentication middleware to all routes
router.use(authenticate);

// Apply role-based access control - only Admin and Faculty can access reports
router.use(requireRoles('admin', 'faculty'));

// GET /api/reports/students - Get filtered list of students for reporting
router.get('/students', getStudentsForReports);

// GET /api/reports/students/:id/dossier - Get complete 360-degree student dossier
router.get('/students/:id/dossier', getStudentDossier);

// GET /api/reports/students/:id/export - Export student profile as PDF
router.get('/students/:id/export', exportStudentProfilePDF);

module.exports = router;
