const Student = require('../models/Student');

async function getStudents(_req, res, next) {
  try {
    const students = await Student.find();
    res.status(200).json(students.map((doc) => doc.toJSON()));
  } catch (err) {
    next(err);
  }
}

module.exports = { getStudents };
