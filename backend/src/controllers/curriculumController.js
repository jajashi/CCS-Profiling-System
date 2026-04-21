const mongoose = require('mongoose');
const Curriculum = require('../models/Curriculum');

function normalizeString(value) {
  return String(value ?? '').trim();
}

function normalizeStringArray(values) {
  if (!Array.isArray(values)) return [];
  return values.map((value) => normalizeString(value)).filter(Boolean);
}

const MAX_COURSE_CODE_LEN = 8;
const CURRICULUM_YEAR_MIN = 2000;
const CURRICULUM_YEAR_MAX = new Date().getFullYear() + 15;

function validateCourseCode(code) {
  if (!code || code.length > MAX_COURSE_CODE_LEN) {
    return `courseCode is required and must be at most ${MAX_COURSE_CODE_LEN} characters.`;
  }
  return null;
}

function validateCurriculumYear(value) {
  const s = normalizeString(value);
  if (!s) {
    return 'curriculumYear is required.';
  }
  if (!/^\d{4}$/.test(s)) {
    return 'curriculumYear must be a four-digit year.';
  }
  const y = parseInt(s, 10);
  if (y < CURRICULUM_YEAR_MIN || y > CURRICULUM_YEAR_MAX) {
    return `curriculumYear must be between ${CURRICULUM_YEAR_MIN} and ${CURRICULUM_YEAR_MAX}.`;
  }
  return null;
}

function parseNonNegativeNumber(value, fallback = 0) {
  if (value == null || value === '') return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

async function getCurricula(req, res, next) {
  try {
    const { program, status } = req.query;
    const query = {};

    if (program && program !== 'All') {
      query.program = program;
    }

    if (status && status !== 'All') {
      query.status = status;
    }

    const curricula = await Curriculum.find(query).sort({ courseCode: 1 });
    return res.status(200).json(curricula);
  } catch (err) {
    return next(err);
  }
}

async function getCurriculumById(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid curriculum id.' });
    }

    const curriculum = await Curriculum.findById(id);
    if (!curriculum) {
      return res.status(404).json({ message: 'Curriculum not found.' });
    }

    return res.status(200).json(curriculum);
  } catch (err) {
    return next(err);
  }
}

async function createCurriculum(req, res, next) {
  try {
    const payload = req.body || {};
    const data = {
      courseCode: normalizeString(payload.courseCode).toUpperCase(),
      courseTitle: normalizeString(payload.courseTitle),
      curriculumYear: normalizeString(payload.curriculumYear),
      description: normalizeString(payload.description),
      program: normalizeString(payload.program),
      creditUnits: parseNonNegativeNumber(payload.creditUnits, 3),
      lectureHours: parseNonNegativeNumber(payload.lectureHours, 0),
      labHours: parseNonNegativeNumber(payload.labHours, 0),
      prerequisites: normalizeStringArray(payload.prerequisites),
      courseLearningOutcomes: normalizeStringArray(payload.courseLearningOutcomes),
    };

    // Basic validation
    const codeErr = validateCourseCode(data.courseCode);
    if (codeErr) {
      return res.status(400).json({ message: codeErr });
    }
    if (!data.courseTitle || !data.program) {
      return res.status(400).json({ message: 'courseTitle and program are required.' });
    }
    const yearErr = validateCurriculumYear(data.curriculumYear);
    if (yearErr) {
      return res.status(400).json({ message: yearErr });
    }

    const created = await Curriculum.create(data);
    return res.status(201).json(created);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'A curriculum with this course code already exists.' });
    }
    return next(err);
  }
}

async function updateCurriculum(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid curriculum id.' });
    }

    const payload = req.body || {};
    const data = {};
    if (payload.courseCode != null) {
      const nextCode = normalizeString(payload.courseCode).toUpperCase();
      const err = validateCourseCode(nextCode);
      if (err) {
        return res.status(400).json({ message: err });
      }
      data.courseCode = nextCode;
    }
    if (payload.courseTitle != null) data.courseTitle = normalizeString(payload.courseTitle);
    if (payload.curriculumYear != null) {
      const cy = normalizeString(payload.curriculumYear);
      const yearErr = validateCurriculumYear(cy);
      if (yearErr) {
        return res.status(400).json({ message: yearErr });
      }
      data.curriculumYear = cy;
    }
    if (payload.description != null) data.description = normalizeString(payload.description);
    if (payload.program != null) data.program = normalizeString(payload.program);
    if (payload.creditUnits != null) data.creditUnits = parseNonNegativeNumber(payload.creditUnits);
    if (payload.lectureHours != null) data.lectureHours = parseNonNegativeNumber(payload.lectureHours);
    if (payload.labHours != null) data.labHours = parseNonNegativeNumber(payload.labHours);
    if (payload.prerequisites != null) data.prerequisites = normalizeStringArray(payload.prerequisites);
    if (payload.courseLearningOutcomes != null) data.courseLearningOutcomes = normalizeStringArray(payload.courseLearningOutcomes);
    if (payload.status != null) data.status = normalizeString(payload.status);

    const curriculum = await Curriculum.findByIdAndUpdate(id, data, { new: true });
    if (!curriculum) {
      return res.status(404).json({ message: 'Curriculum not found.' });
    }

    return res.status(200).json(curriculum);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'A curriculum with this course code already exists.' });
    }
    return next(err);
  }
}

async function archiveCurriculum(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid curriculum id.' });
    }

    const curriculum = await Curriculum.findById(id);
    if (!curriculum) {
      return res.status(404).json({ message: 'Curriculum not found.' });
    }

    if (curriculum.status === 'Archived') {
      return res.status(400).json({ message: 'Curriculum is already archived.' });
    }

    curriculum.status = 'Archived';
    await curriculum.save();

    return res.status(200).json({ message: 'Curriculum archived successfully.', curriculum });
  } catch (err) {
    return next(err);
  }
}

async function restoreCurriculum(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid curriculum id.' });
    }

    const curriculum = await Curriculum.findById(id);
    if (!curriculum) {
      return res.status(404).json({ message: 'Curriculum not found.' });
    }

    if (curriculum.status !== 'Archived') {
      return res.status(400).json({ message: 'Only archived curricula can be restored.' });
    }

    curriculum.status = 'Active';
    await curriculum.save();

    return res.status(200).json({ message: 'Curriculum restored successfully.', curriculum });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  getCurricula,
  getCurriculumById,
  createCurriculum,
  updateCurriculum,
  archiveCurriculum,
  restoreCurriculum,
};