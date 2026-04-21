const express = require('express');
const {
  getSyllabi,
  getSyllabusById,
  createSyllabus,
  updateSyllabus,
  archiveSyllabus,
  updateWeeklyLesson,
} = require('../controllers/syllabusController');
const { authenticate, requireRoles } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', authenticate, requireRoles('admin', 'faculty'), getSyllabi);
router.get('/:id', authenticate, requireRoles('admin', 'faculty'), getSyllabusById);
router.post('/', authenticate, requireRoles('admin'), createSyllabus);
router.put('/:id', authenticate, requireRoles('admin'), updateSyllabus);
router.delete('/:id', authenticate, requireRoles('admin'), archiveSyllabus);
router.patch('/:id/lessons/:lessonId', authenticate, requireRoles('admin'), updateWeeklyLesson);

module.exports = router;
