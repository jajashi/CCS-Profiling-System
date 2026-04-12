const express = require('express');
const {
  getSpecializations,
  getSpecializationById,
  createSpecialization,
  updateSpecialization,
  deleteSpecialization,
} = require('../controllers/specializationController');
const { authenticate, requireRoles } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', authenticate, requireRoles('admin', 'faculty', 'student'), getSpecializations);
router.get('/:id', authenticate, requireRoles('admin', 'faculty', 'student'), getSpecializationById);
router.post('/', authenticate, requireRoles('admin'), createSpecialization);
router.put('/:id', authenticate, requireRoles('admin'), updateSpecialization);
router.delete('/:id', authenticate, requireRoles('admin'), deleteSpecialization);

module.exports = router;
