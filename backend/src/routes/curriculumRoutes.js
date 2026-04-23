const express = require('express');
const {
  getCurricula,
  getCurriculumById,
  createCurriculum,
  updateCurriculum,
  archiveCurriculum,
  restoreCurriculum,
} = require('../controllers/curriculumController');
const { authenticate, requireRoles } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', authenticate, requireRoles('admin'), getCurricula);
router.post('/', authenticate, requireRoles('admin'), createCurriculum);
router.patch('/:id/restore', authenticate, requireRoles('admin'), restoreCurriculum);
router.get('/:id', authenticate, requireRoles('admin'), getCurriculumById);
router.put('/:id', authenticate, requireRoles('admin'), updateCurriculum);
router.delete('/:id', authenticate, requireRoles('admin'), archiveCurriculum);

module.exports = router;