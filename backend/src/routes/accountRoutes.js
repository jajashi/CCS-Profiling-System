const express = require('express');
const {
  listAccounts,
  listStudentAccountProfiles,
  listFacultyAccountProfiles,
  createAdminAccount,
  provisionStudentAccount,
  provisionFacultyAccount,
  resetAccountPassword,
  updateAccountStatus,
  deleteAccount,
  searchUsers,
} = require('../controllers/accountController');
const { authenticate, requireRoles } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/search', authenticate, requireRoles('admin', 'faculty', 'student_leader'), searchUsers);

router.use(authenticate, requireRoles('admin'));
router.get('/', listAccounts);
router.get('/profiles/students', listStudentAccountProfiles);
router.get('/profiles/faculty', listFacultyAccountProfiles);
router.post('/admins', createAdminAccount);
router.post('/provision/student/:studentId', provisionStudentAccount);
router.post('/provision/faculty/:employeeId', provisionFacultyAccount);
router.post('/:id/reset-password', resetAccountPassword);
router.patch('/:id/status', updateAccountStatus);
router.delete('/:id', deleteAccount);

module.exports = router;
