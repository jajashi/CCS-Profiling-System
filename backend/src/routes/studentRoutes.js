const express = require('express');
const { getStudents, createStudent, updateStudent } = require('../controllers/studentController');

const router = express.Router();

router.get('/', getStudents);
router.post('/', createStudent);
router.put('/:id', updateStudent);
router.patch('/:id', updateStudent);

module.exports = router;
