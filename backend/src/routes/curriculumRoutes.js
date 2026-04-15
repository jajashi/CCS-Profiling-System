const express = require('express');
const {
  getCurricula,
  getCurriculumById,
  createCurriculum,
  updateCurriculum,
  archiveCurriculum,
} = require('../controllers/curriculumController');
const { authenticate, requireRoles } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', authenticate, requireRoles('admin', 'faculty'), getCurricula);
router.get('/:id', authenticate, requireRoles('admin', 'faculty'), getCurriculumById);
router.post('/', authenticate, requireRoles('admin'), createCurriculum);
router.put('/:id', authenticate, requireRoles('admin'), updateCurriculum);
router.delete('/:id', authenticate, requireRoles('admin'), archiveCurriculum);

module.exports = router;