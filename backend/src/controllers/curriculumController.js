const mongoose = require('mongoose');
const {
  Curriculum,
  COURSE_CODE_REGEX,
  PROGRAM_ENUM,
  STATUS_ENUM,
} = require('../models/Curriculum');

function normalizeString(value) {
  return String(value ?? '').trim();
}

function normalizeCode(value) {
  return normalizeString(value).toUpperCase();
}

function parseNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function normalizeCLOs(values) {
  if (!Array.isArray(values)) return [];
  return values.map((value) => normalizeString(value)).filter(Boolean);
}

function normalizePrerequisites(values) {
  if (!Array.isArray(values)) return [];
  const cleaned = values.map((value) => normalizeCode(value)).filter(Boolean);
  return [...new Set(cleaned)];
}

function validatePayload(payload) {
  const courseCode = normalizeCode(payload.courseCode);
  const courseTitle = normalizeString(payload.courseTitle);
  const program = normalizeString(payload.program);
  const creditUnits = parseNumber(payload.creditUnits);
  const lectureHours = parseNumber(payload.lectureHours);
  const labHours = parseNumber(payload.labHours);
  const courseLearningOutcomes = normalizeCLOs(payload.courseLearningOutcomes);
  const prerequisites = normalizePrerequisites(payload.prerequisites);

  if (!courseCode) return 'courseCode is required.';
  if (!COURSE_CODE_REGEX.test(courseCode)) return 'courseCode must match /^[A-Z]{2,4}\\d{3}$/.';
  if (!courseTitle) return 'courseTitle is required.';
  if (!PROGRAM_ENUM.includes(program)) return `program must be one of: ${PROGRAM_ENUM.join(', ')}.`;
  if (creditUnits === null || creditUnits < 1 || creditUnits > 6) {
    return 'creditUnits must be between 1 and 6.';
  }
  if (lectureHours === null || lectureHours < 0) return 'lectureHours must be 0 or greater.';
  if (labHours === null || labHours < 0) return 'labHours must be 0 or greater.';
  if (courseLearningOutcomes.length === 0) return 'At least one non-empty course learning outcome is required.';
  if (!prerequisites.every((code) => COURSE_CODE_REGEX.test(code))) {
    return 'All prerequisites must be valid courseCode values.';
  }

  return null;
}

function buildDocument(payload) {
  return {
    courseCode: normalizeCode(payload.courseCode),
    courseTitle: normalizeString(payload.courseTitle),
    description: normalizeString(payload.description),
    program: normalizeString(payload.program),
    creditUnits: parseNumber(payload.creditUnits),
    lectureHours: parseNumber(payload.lectureHours),
    labHours: parseNumber(payload.labHours),
    prerequisites: normalizePrerequisites(payload.prerequisites),
    courseLearningOutcomes: normalizeCLOs(payload.courseLearningOutcomes),
  };
}

async function ensurePrerequisitesExist(codes) {
  if (!Array.isArray(codes) || codes.length === 0) return null;
  const found = await Curriculum.find({
    courseCode: { $in: codes },
    status: 'Active',
  })
    .select('courseCode')
    .lean();
  const foundSet = new Set(found.map((row) => row.courseCode));
  const missing = codes.filter((code) => !foundSet.has(code));
  if (missing.length > 0) {
    return `The following prerequisites are missing or archived: ${missing.join(', ')}`;
  }
  return null;
}

async function resolveSyllabusModel() {
  if (mongoose.models.Syllabus) return mongoose.models.Syllabus;
  try {
    return require('../models/Syllabus');
  } catch {
    return null;
  }
}

async function getCurricula(req, res, next) {
  try {
    const { status, program } = req.query;
    const query = {};

    if (!status || String(status).trim() === '') {
      query.status = 'Active';
    } else if (String(status).trim() === 'All') {
      // Include both active and archived.
    } else if (STATUS_ENUM.includes(String(status).trim())) {
      query.status = String(status).trim();
    } else {
      return res.status(400).json({ message: `status must be one of: ${STATUS_ENUM.join(', ')}, All.` });
    }

    if (program) {
      const normalizedProgram = String(program).trim();
      if (!PROGRAM_ENUM.includes(normalizedProgram)) {
        return res.status(400).json({ message: `program must be one of: ${PROGRAM_ENUM.join(', ')}.` });
      }
      query.program = normalizedProgram;
    }

    const rows = await Curriculum.find(query).sort({ courseCode: 1 });
    return res.status(200).json(rows);
  } catch (err) {
    return next(err);
  }
}

async function createCurriculum(req, res, next) {
  try {
    const payload = req.body || {};
    const validationError = validatePayload(payload);
    if (validationError) return res.status(400).json({ message: validationError });

    const data = buildDocument(payload);

    const duplicate = await Curriculum.findOne({ courseCode: data.courseCode }).lean();
    if (duplicate) {
      return res.status(409).json({ message: 'courseCode already exists.' });
    }

    const prerequisiteError = await ensurePrerequisitesExist(data.prerequisites);
    if (prerequisiteError) return res.status(400).json({ message: prerequisiteError });

    const created = await Curriculum.create(data);
    return res.status(201).json(created.toJSON());
  } catch (err) {
    if (err && err.code === 11000) {
      return res.status(409).json({ message: 'courseCode already exists.' });
    }
    if (err && err.name === 'ValidationError') {
      return res.status(400).json({ message: 'Please check curriculum fields and try again.' });
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
    const validationError = validatePayload(payload);
    if (validationError) return res.status(400).json({ message: validationError });

    const current = await Curriculum.findById(id);
    if (!current) {
      return res.status(404).json({ message: 'Curriculum not found.' });
    }

    const data = buildDocument(payload);
    const duplicate = await Curriculum.findOne({
      _id: { $ne: id },
      courseCode: data.courseCode,
    }).lean();
    if (duplicate) {
      return res.status(409).json({ message: 'courseCode already exists.' });
    }

    const selfReferenced = data.prerequisites.includes(data.courseCode);
    if (selfReferenced) {
      return res.status(400).json({ message: 'A curriculum cannot reference itself as a prerequisite.' });
    }

    const prerequisiteError = await ensurePrerequisitesExist(data.prerequisites);
    if (prerequisiteError) return res.status(400).json({ message: prerequisiteError });

    const updated = await Curriculum.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });
    return res.status(200).json(updated.toJSON());
  } catch (err) {
    if (err && err.code === 11000) {
      return res.status(409).json({ message: 'courseCode already exists.' });
    }
    if (err && err.name === 'ValidationError') {
      return res.status(400).json({ message: 'Please check curriculum fields and try again.' });
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

    const Syllabus = await resolveSyllabusModel();
    if (Syllabus) {
      const referencingSyllabus = await Syllabus.findOne({
        status: { $in: ['Active', 'Draft'] },
        $or: [
          { curriculum: curriculum._id },
          { curriculumId: curriculum._id },
          { curriculumCourseCode: curriculum.courseCode },
          { courseCode: curriculum.courseCode },
          { courses: { $in: [curriculum.courseCode] } },
          { courseCodes: { $in: [curriculum.courseCode] } },
        ],
      }).lean();

      if (referencingSyllabus) {
        return res.status(400).json({
          message: 'This curriculum cannot be archived because it is referenced by an active or draft syllabus.',
        });
      }
    }

    curriculum.status = 'Archived';
    await curriculum.save();
    return res.status(200).json({ message: 'Curriculum archived successfully.', curriculum: curriculum.toJSON() });
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

    if (curriculum.status === 'Active') {
      return res.status(200).json({ message: 'Curriculum is already active.', curriculum: curriculum.toJSON() });
    }

    const prerequisiteError = await ensurePrerequisitesExist(curriculum.prerequisites || []);
    if (prerequisiteError) {
      return res.status(400).json({
        message: `This curriculum cannot be restored because prerequisites are not active. ${prerequisiteError}`,
      });
    }

    curriculum.status = 'Active';
    await curriculum.save();
    return res.status(200).json({ message: 'Curriculum restored successfully.', curriculum: curriculum.toJSON() });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  getCurricula,
  createCurriculum,
  updateCurriculum,
  archiveCurriculum,
  restoreCurriculum,
};
