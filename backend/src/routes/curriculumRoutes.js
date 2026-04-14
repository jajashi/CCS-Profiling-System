const express = require('express');
const {
  getCurricula,
  createCurriculum,
  updateCurriculum,
  archiveCurriculum,
  restoreCurriculum,
} = require('../controllers/curriculumController');
const { authenticate, requireRoles } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', authenticate, requireRoles('admin', 'faculty'), getCurricula);
router.post('/', authenticate, requireRoles('admin'), createCurriculum);
router.put('/:id', authenticate, requireRoles('admin'), updateCurriculum);
router.delete('/:id', authenticate, requireRoles('admin'), archiveCurriculum);
router.patch('/:id/restore', authenticate, requireRoles('admin'), restoreCurriculum);

module.exports = router;
