const express = require('express');
const {
  getFaculty,
  getFacultyById,
  createFaculty,
  updateFaculty,
  getFacultyAnalytics,
} = require('../controllers/facultyController');

const router = express.Router();

router.get('/', getFaculty);
router.get('/analytics', getFacultyAnalytics);
router.get('/:employeeId', getFacultyById);
router.post('/', createFaculty);
router.put('/:employeeId', updateFaculty);

module.exports = router;
