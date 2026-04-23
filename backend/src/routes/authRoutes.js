const express = require('express');
const { login, changePassword } = require('../controllers/authController');
const { authenticate } = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/login', login);
router.post('/change-password', authenticate, changePassword);

module.exports = router;
