const Student = require('../models/Student');
const STUDENT_ID_PREFIX = '2201';
const STUDENT_ID_DIGITS = 3;
const MANUAL_ID_MAX = 899; // Reserve 900-999 for seed/demo IDs.
const MOBILE_REGEX = /^09\d{9}$/;

async function generateNextStudentId() {
  const pattern = new RegExp(`^${STUDENT_ID_PREFIX}\\d{${STUDENT_ID_DIGITS}}$`);
  const students = await Student.find({ id: pattern }, { id: 1, _id: 0 }).lean();
  const maxManual = students.reduce((max, student) => {
    const numeric = Number.parseInt(String(student.id).slice(STUDENT_ID_PREFIX.length), 10);
    if (!Number.isInteger(numeric) || numeric > MANUAL_ID_MAX) return max;
    return numeric > max ? numeric : max;
  }, 0);

  const nextNumber = maxManual + 1;
  if (nextNumber > MANUAL_ID_MAX) {
    throw new Error('Manual student ID limit reached.');
  }

  const suffix = String(nextNumber).padStart(STUDENT_ID_DIGITS, '0');
  return `${STUDENT_ID_PREFIX}${suffix}`;
}

async function getStudents(req, res, next) {
  try {
    const {
      program,
      skill,
      yearLevel,
      section,
      status,
      scholarship,
      gender,
      violation,
      search,
    } = req.query;

    const filter = {};

    if (program && program.trim() !== "") {
      filter.program = program.trim();
    }

    if (skill && skill.trim() !== "") {
      // Support multiple skills (comma-separated or array)
      const skills = Array.isArray(skill)
        ? skill
        : skill.split(",").map((s) => s.trim());
      filter.skills = { $all: skills };
    }

    if (yearLevel && yearLevel.trim() !== "") {
      filter.yearLevel = yearLevel.trim();
    }

    if (section && section.trim() !== "") {
      filter.section = section.trim();
    }

    if (status && status.trim() !== "") {
      filter.status = status.trim();
    }

    if (scholarship && scholarship.trim() !== "") {
      filter.scholarship = scholarship.trim();
    }

    if (gender && gender.trim() !== "") {
      filter.gender = gender.trim();
    }

    if (violation && violation.trim() !== "") {
      filter.violation = violation.trim();
    }

    if (search && search.trim() !== "") {
      const searchRegex = new RegExp(search.trim(), "i");
      filter.$or = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { id: searchRegex },
        { email: searchRegex },
        { program: searchRegex },
        { section: searchRegex },
        { status: searchRegex },
        { scholarship: searchRegex },
        { gender: searchRegex },
        { violation: searchRegex },
        { guardian: searchRegex },
      ];
    }

    const students = await Student.find(filter);
    res.status(200).json(students.map((doc) => doc.toJSON()));
  } catch (err) {
    next(err);
  }
}

async function createStudent(req, res, next) {
  try {
    const payload = req.body || {};

    // Keep server-side validation explicit so the frontend can show 400 errors nicely.
    const requiredFields = [
      'firstName',
      'lastName',
      'program',
      'yearLevel',
      'section',
      'status',
      'email',
      'contact',
      'dateEnrolled',
      'guardian',
      'guardianContact',
    ];
    const missing = requiredFields.filter((key) => {
      const value = payload[key];
      return value === undefined || value === null || String(value).trim().length === 0;
    });

    if (missing.length > 0) {
      return res.status(400).json({
        message: `Missing required field(s): ${missing.join(', ')}`,
      });
    }

    if (payload.contact && !MOBILE_REGEX.test(String(payload.contact).trim())) {
      return res.status(400).json({
        message: 'Contact number must start with 09 and contain exactly 11 digits.',
      });
    }

    // Normalize key fields.
    const normalized = {
      ...payload,
      id: await generateNextStudentId(),
      firstName: String(payload.firstName).trim(),
      lastName: String(payload.lastName).trim(),
      program: String(payload.program).trim(),
      yearLevel: String(payload.yearLevel).trim(),
      skills: Array.isArray(payload.skills)
        ? payload.skills.map((s) => String(s).trim()).filter(Boolean)
        : [],
    };

    const created = await Student.create(normalized);
    return res.status(201).json(created.toJSON());
  } catch (err) {
    // Duplicate `id` (unique index) -> 400 with friendly message
    if (err && err.code === 11000) {
      return res.status(400).json({ message: 'A student with this ID already exists.' });
    }

    // Mongoose schema validation -> 400
    if (err && err.name === 'ValidationError') {
      return res.status(400).json({ message: 'Please check the form fields and try again.' });
    }

    next(err);
  }
}

async function updateStudent(req, res, next) {
  try {
    const mongoId = req.params.id;
    const payload = req.body || {};

    // Same required fields as create, so the form stays consistent.
    const requiredFields = [
      'id',
      'firstName',
      'lastName',
      'program',
      'yearLevel',
      'section',
      'status',
      'email',
      'contact',
      'dateEnrolled',
      'guardian',
      'guardianContact',
    ];
    const missing = requiredFields.filter((key) => {
      const value = payload[key];
      return value === undefined || value === null || String(value).trim().length === 0;
    });

    if (missing.length > 0) {
      return res.status(400).json({
        message: `Missing required field(s): ${missing.join(', ')}`,
      });
    }

    if (payload.contact && !MOBILE_REGEX.test(String(payload.contact).trim())) {
      return res.status(400).json({
        message: 'Contact number must start with 09 and contain exactly 11 digits.',
      });
    }

    const stringKeys = [
      'middleName',
      'gender',
      'dob',
      'section',
      'status',
      'scholarship',
      'profileAvatar',
      'email',
      'contact',
      'dateEnrolled',
      'guardian',
      'guardianContact',
      'violation',
    ];

    const normalized = {
      id: String(payload.id).trim(),
      firstName: String(payload.firstName).trim(),
      lastName: String(payload.lastName).trim(),
      program: String(payload.program).trim(),
      yearLevel: String(payload.yearLevel).trim(),
    };

    for (const key of stringKeys) {
      normalized[key] = String(payload[key] ?? '').trim();
    }
    normalized.skills = Array.isArray(payload.skills)
      ? payload.skills.map((s) => String(s).trim()).filter(Boolean)
      : [];

    // Handle skills array separately
    if (Array.isArray(payload.skills)) {
      normalized.skills = payload.skills;
    } else if (payload.skills === undefined || payload.skills === null) {
      normalized.skills = [];
    }

    const updated = await Student.findByIdAndUpdate(mongoId, normalized, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      return res.status(404).json({ message: 'Student not found.' });
    }

    return res.status(200).json(updated.toJSON());
  } catch (err) {
    if (err && err.code === 11000) {
      return res.status(400).json({ message: 'A student with this ID already exists.' });
    }

    if (err && err.name === 'ValidationError') {
      return res.status(400).json({ message: 'Please check the form fields and try again.' });
    }

    if (err && err.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid student identifier.' });
    }

    next(err);
  }
}

async function deleteStudent(req, res, next) {
  try {
    const mongoId = req.params.id;

    const deleted = await Student.findByIdAndDelete(mongoId);
    if (!deleted) {
      return res.status(404).json({ message: 'Student not found.' });
    }

    return res.status(204).send();
  } catch (err) {
    if (err && err.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid student identifier.' });
    }
    return next(err);
  }
}

module.exports = { getStudents, createStudent, updateStudent, deleteStudent };
