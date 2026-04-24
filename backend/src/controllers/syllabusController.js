const mongoose = require('mongoose');
const Curriculum = require('../models/Curriculum');
const Faculty = require('../models/Faculty');
const User = require('../models/User');
const { Syllabus, SYLLABUS_STATUS_ENUM, LESSON_STATUS_ENUM } = require('../models/Syllabus');
const { logActivity } = require('../services/activityLogService');

function normalizeString(value) {
  return String(value ?? '').trim();
}

function normalizeStringArray(values) {
  if (!Array.isArray(values)) return [];
  return values.map((value) => normalizeString(value)).filter(Boolean);
}

function normalizeOptionalObjectId(value) {
  if (value == null || value === '') return null;
  return mongoose.Types.ObjectId.isValid(value) ? new mongoose.Types.ObjectId(value) : null;
}

function parseNonNegativeNumber(value, fallback = 0) {
  if (value == null || value === '') return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function isAdmin(req) {
  return req.user?.role === 'admin';
}

/**
 * Resolve the Faculty document for the current JWT user (faculty accounts use username = employeeId in seed data).
 */
async function resolveFacultyActor(req) {
  if (!req.user || req.user.role !== 'faculty') return null;
  const user = await User.findById(req.user.id).select('username role').lean();
  if (!user || user.role !== 'faculty') return null;
  return Faculty.findOne({ employeeId: user.username }).select('_id').lean();
}

async function assertCanManageWeeklyLessons(req, syllabus) {
  if (isAdmin(req)) return null;
  const actor = await resolveFacultyActor(req);
  if (!actor || String(actor._id) !== String(syllabus.facultyId)) {
    return { status: 403, message: 'You can only update weekly lessons on syllabi assigned to you.' };
  }
  return null;
}

async function resolveSectionModel() {
  if (mongoose.models.Section) return mongoose.models.Section;
  try {
    return require('../models/Section');
  } catch {
    return null;
  }
}

async function resolveSectionIdForCreate({ curriculumId, facultyId, explicitSectionId }) {
  const Section = await resolveSectionModel();
  if (!Section) {
    return { sectionId: explicitSectionId || null };
  }

  if (explicitSectionId) {
    return { sectionId: explicitSectionId };
  }

  if (!curriculumId || !facultyId) {
    return { error: 'curriculumId and facultyId are required to resolve a section.' };
  }

  const section = await Section.findOne({
    curriculumId,
    facultyId,
    status: 'Active',
  })
    .sort({ updatedAt: -1, createdAt: -1 })
    .select('_id')
    .lean();

  if (!section) {
    return { sectionId: null };
  }

  return { sectionId: section._id };
}

function buildListPopulateOptions(includeSection) {
  const populate = [
    { path: 'curriculumId', select: 'courseCode courseTitle curriculumYear' },
    { path: 'facultyId', select: 'employeeId firstName lastName' },
  ];

  if (includeSection) {
    populate.push({
      path: 'sectionId',
      select: 'sectionIdentifier term academicYear',
    });
  }

  return populate;
}

function buildDetailPopulateOptions(includeSection) {
  const populate = ['curriculumId', 'facultyId'];
  if (includeSection) populate.push('sectionId');
  return populate;
}

function validateSequentialWeekNumbers(weeklyLessons) {
  if (!Array.isArray(weeklyLessons)) return 'weeklyLessons must be an array.';

  const weekNumbers = weeklyLessons.map((lesson) => Number(lesson.weekNumber));
  if (weekNumbers.some((weekNumber) => !Number.isInteger(weekNumber))) {
    return 'Each weekly lesson must include an integer weekNumber.';
  }

  const sorted = [...weekNumbers].sort((a, b) => a - b);
  const uniqueCount = new Set(sorted).size;
  if (uniqueCount !== sorted.length) {
    return 'weekNumber values must be unique across weeklyLessons.';
  }

  for (let index = 0; index < sorted.length; index += 1) {
    const expected = index + 1;
    if (sorted[index] !== expected) {
      return 'weekNumber values must be sequential starting at 1 with no gaps.';
    }
  }

  return null;
}

function normalizeLessonPayload(lesson, { allowPartial = false } = {}) {
  const payload = {};

  if (!allowPartial || Object.prototype.hasOwnProperty.call(lesson, 'weekNumber')) {
    const weekNumber = Number(lesson.weekNumber);
    payload.weekNumber = Number.isFinite(weekNumber) ? weekNumber : lesson.weekNumber;
  }

  if (!allowPartial || Object.prototype.hasOwnProperty.call(lesson, 'topic')) {
    payload.topic = normalizeString(lesson.topic);
  }

  if (!allowPartial || Object.prototype.hasOwnProperty.call(lesson, 'objectives')) {
    payload.objectives = normalizeStringArray(lesson.objectives);
  }

  if (!allowPartial || Object.prototype.hasOwnProperty.call(lesson, 'materials')) {
    payload.materials = normalizeStringArray(lesson.materials);
  }

  if (!allowPartial || Object.prototype.hasOwnProperty.call(lesson, 'assessments')) {
    payload.assessments = normalizeString(lesson.assessments);
  }

  if (!allowPartial || Object.prototype.hasOwnProperty.call(lesson, 'timeAllocation')) {
    const timeAllocation = lesson.timeAllocation && typeof lesson.timeAllocation === 'object'
      ? lesson.timeAllocation
      : {};

    payload.timeAllocation = {
      lectureMinutes: parseNonNegativeNumber(timeAllocation.lectureMinutes, 0),
      labMinutes: parseNonNegativeNumber(timeAllocation.labMinutes, 0),
    };
  }

  if (!allowPartial || Object.prototype.hasOwnProperty.call(lesson, 'status')) {
    payload.status = normalizeString(lesson.status || 'Pending');
  }

  return payload;
}

function validateLessonShape(lesson, { allowPartial = false } = {}) {
  if (!allowPartial || Object.prototype.hasOwnProperty.call(lesson, 'weekNumber')) {
    if (!Number.isInteger(lesson.weekNumber) || lesson.weekNumber < 1 || lesson.weekNumber > 18) {
      return 'weekNumber must be an integer between 1 and 18.';
    }
  }

  if (!allowPartial || Object.prototype.hasOwnProperty.call(lesson, 'topic')) {
    if (!lesson.topic) return 'topic is required for each weekly lesson.';
  }

  if (Object.prototype.hasOwnProperty.call(lesson, 'timeAllocation')) {
    if (lesson.timeAllocation.lectureMinutes === null || lesson.timeAllocation.labMinutes === null) {
      return 'timeAllocation lectureMinutes and labMinutes must be 0 or greater.';
    }
  }

  if ((!allowPartial || Object.prototype.hasOwnProperty.call(lesson, 'status'))
    && !LESSON_STATUS_ENUM.includes(lesson.status)) {
    return `Lesson status must be one of: ${LESSON_STATUS_ENUM.join(', ')}.`;
  }

  return null;
}

function buildSyllabusPayload(payload) {
  const data = {
    curriculumId: normalizeOptionalObjectId(payload.curriculumId),
    facultyId: normalizeOptionalObjectId(payload.facultyId),
    sectionId: normalizeOptionalObjectId(payload.sectionId),
    description: normalizeString(payload.description),
    gradingSystem: normalizeString(payload.gradingSystem),
    coursePolicies: normalizeString(payload.coursePolicies),
    status: normalizeString(payload.status || 'Draft') || 'Draft',
  };

  if (Object.prototype.hasOwnProperty.call(payload, 'weeklyLessons')) {
    data.weeklyLessons = Array.isArray(payload.weeklyLessons)
      ? payload.weeklyLessons.map((lesson) => normalizeLessonPayload(lesson))
      : payload.weeklyLessons;
  }

  return data;
}

function validateTopLevelPayload(payload, { isCreate = false } = {}) {
  const requiredFields = ['curriculumId', 'facultyId'];
  const objectIdFields = ['curriculumId', 'facultyId', 'sectionId'];

  if (isCreate) {
    const missing = requiredFields.filter((key) => !payload[key]);
    if (missing.length > 0) {
      return `Missing required field(s): ${missing.join(', ')}.`;
    }
    if (!Array.isArray(payload.weeklyLessons) || payload.weeklyLessons.length < 1) {
      return 'At least one weekly lesson is required.';
    }
  }

  for (const key of objectIdFields) {
    if (payload[key] != null && payload[key] !== '' && !mongoose.Types.ObjectId.isValid(payload[key])) {
      return `${key} must be a valid ObjectId.`;
    }
  }

  if (payload.status != null && payload.status !== '' && !SYLLABUS_STATUS_ENUM.includes(normalizeString(payload.status))) {
    return `status must be one of: ${SYLLABUS_STATUS_ENUM.join(', ')}.`;
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'weeklyLessons')) {
    if (!Array.isArray(payload.weeklyLessons)) {
      return 'weeklyLessons must be an array.';
    }

    for (const lesson of payload.weeklyLessons) {
      const normalizedLesson = normalizeLessonPayload(lesson);
      const lessonError = validateLessonShape(normalizedLesson);
      if (lessonError) return lessonError;
    }

    const sequenceError = validateSequentialWeekNumbers(payload.weeklyLessons);
    if (sequenceError) return sequenceError;
  }

  return null;
}

async function ensureReferencesExist(data, { checkFacultyActive = false } = {}) {
  const curriculum = await Curriculum.findById(data.curriculumId).select('_id').lean();
  if (!curriculum) return 'Referenced curriculum was not found.';

  const faculty = await Faculty.findById(data.facultyId).select('_id status').lean();
  if (!faculty) return 'Referenced faculty was not found.';
  if (checkFacultyActive && faculty.status === 'Inactive') {
    return 'Inactive faculty cannot create a new syllabus.';
  }

  const Section = await resolveSectionModel();
  if (Section && data.sectionId) {
    const section = await Section.findById(data.sectionId).select('curriculumId facultyId').lean();
    if (!section) return 'Referenced section was not found.';
    if (section.curriculumId && data.curriculumId && String(section.curriculumId) !== String(data.curriculumId)) {
      return 'Section assignment does not match curriculum.';
    }
    if (section.facultyId && data.facultyId && String(section.facultyId) !== String(data.facultyId)) {
      return 'Section assignment does not match faculty.';
    }
  }

  return null;
}

async function ensureCombinationAvailable({ syllabusId = null, facultyId, sectionId }) {
  if (!sectionId) return null;

  const duplicate = await Syllabus.findOne({
    _id: syllabusId ? { $ne: syllabusId } : { $exists: true },
    facultyId,
    sectionId,
    status: { $in: ['Draft', 'Active'] },
  })
    .select('_id status')
    .lean();

  if (duplicate) {
    return 'A draft or active syllabus already exists for this faculty and section.';
  }

  return null;
}

async function getSyllabi(req, res, next) {
  try {
    const { facultyId, curriculumId, sectionId, status } = req.query;
    const query = {};

    if (facultyId) {
      if (!mongoose.Types.ObjectId.isValid(facultyId)) {
        return res.status(400).json({ message: 'facultyId must be a valid ObjectId.' });
      }
      query.facultyId = facultyId;
    }

    if (curriculumId) {
      if (!mongoose.Types.ObjectId.isValid(curriculumId)) {
        return res.status(400).json({ message: 'curriculumId must be a valid ObjectId.' });
      }
      query.curriculumId = curriculumId;
    }

    if (sectionId) {
      if (!mongoose.Types.ObjectId.isValid(sectionId)) {
        return res.status(400).json({ message: 'sectionId must be a valid ObjectId.' });
      }
      query.sectionId = sectionId;
    }

    if (status) {
      const normalizedStatus = normalizeString(status);
      if (!SYLLABUS_STATUS_ENUM.includes(normalizedStatus)) {
        return res.status(400).json({ message: `status must be one of: ${SYLLABUS_STATUS_ENUM.join(', ')}.` });
      }
      query.status = normalizedStatus;
    }

    const Section = await resolveSectionModel();
    const syllabi = await Syllabus.find(query)
      .populate(buildListPopulateOptions(true))
      .sort({ updatedAt: -1, createdAt: -1 });

    return res.status(200).json(syllabi.map((row) => row.toJSON()));
  } catch (err) {
    return next(err);
  }
}

async function getSyllabusById(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid syllabus id.' });
    }

    const Section = await resolveSectionModel();
    const syllabus = await Syllabus.findById(id).populate(buildDetailPopulateOptions(Boolean(Section)));
    if (!syllabus) {
      return res.status(404).json({ message: 'Syllabus not found.' });
    }

    return res.status(200).json(syllabus.toJSON());
  } catch (err) {
    return next(err);
  }
}

async function createSyllabus(req, res, next) {
  try {
    const payload = req.body || {};
    const validationError = validateTopLevelPayload(payload, { isCreate: true });
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const data = buildSyllabusPayload(payload);

    const resolved = await resolveSectionIdForCreate({
      curriculumId: data.curriculumId,
      facultyId: data.facultyId,
      explicitSectionId: data.sectionId,
    });
    if (resolved.error) {
      return res.status(400).json({ message: resolved.error });
    }
    data.sectionId = resolved.sectionId;

    const referenceError = await ensureReferencesExist(data, { checkFacultyActive: true });
    if (referenceError) {
      return res.status(400).json({ message: referenceError });
    }

    const duplicateError = await ensureCombinationAvailable({
      facultyId: data.facultyId,
      sectionId: data.sectionId,
    });
    if (duplicateError) {
      return res.status(409).json({ message: duplicateError });
    }

    const created = await Syllabus.create(data);
    const Section = await resolveSectionModel();
    const populated = await Syllabus.findById(created._id).populate(buildDetailPopulateOptions(Boolean(Section)));
    await logActivity(req, {
      action: 'Created syllabus',
      module: 'Instruction',
      target: populated?._id || created._id,
      status: 'Completed',
    });
    return res.status(201).json(populated.toJSON());
  } catch (err) {
    if (err && err.name === 'ValidationError') {
      return res.status(400).json({ message: 'Please check syllabus fields and try again.' });
    }
    return next(err);
  }
}

async function updateSyllabus(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid syllabus id.' });
    }

    const payload = req.body || {};
    const validationError = validateTopLevelPayload(payload, { isCreate: false });
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const syllabus = await Syllabus.findById(id);
    if (!syllabus) {
      return res.status(404).json({ message: 'Syllabus not found.' });
    }

    if (syllabus.status === 'Archived') {
      return res.status(400).json({ message: 'Archived syllabi are read-only and cannot be updated.' });
    }

    const requestedStatus = payload.status == null ? syllabus.status : normalizeString(payload.status);
    if (requestedStatus === 'Archived') {
      return res.status(400).json({ message: 'Use DELETE /api/syllabi/:id to archive a syllabus.' });
    }

    if (syllabus.status === 'Draft' && requestedStatus === 'Active' && !isAdmin(req)) {
      return res.status(403).json({ message: 'Only admins can transition a syllabus from Draft to Active.' });
    }

    const nextFacultyId = payload.facultyId ? normalizeOptionalObjectId(payload.facultyId) : syllabus.facultyId;
    const nextCurriculumId = payload.curriculumId
      ? normalizeOptionalObjectId(payload.curriculumId)
      : syllabus.curriculumId;
    const nextSectionId = Object.prototype.hasOwnProperty.call(payload, 'sectionId')
      ? normalizeOptionalObjectId(payload.sectionId)
      : syllabus.sectionId;

    const referenceError = await ensureReferencesExist(
      {
        curriculumId: nextCurriculumId,
        facultyId: nextFacultyId,
        sectionId: nextSectionId,
      },
      { checkFacultyActive: false },
    );
    if (referenceError) {
      return res.status(400).json({ message: referenceError });
    }

    const duplicateError = await ensureCombinationAvailable({
      syllabusId: syllabus._id,
      facultyId: nextFacultyId,
      sectionId: nextSectionId,
    });
    if (duplicateError) {
      return res.status(409).json({ message: duplicateError });
    }

    const data = buildSyllabusPayload(payload);

    if (payload.curriculumId != null) syllabus.curriculumId = data.curriculumId;
    if (payload.facultyId != null) syllabus.facultyId = data.facultyId;
    if (Object.prototype.hasOwnProperty.call(payload, 'sectionId')) syllabus.sectionId = data.sectionId;
    if (payload.description != null) syllabus.description = data.description;
    if (payload.gradingSystem != null) syllabus.gradingSystem = data.gradingSystem;
    if (payload.coursePolicies != null) syllabus.coursePolicies = data.coursePolicies;
    if (payload.status != null) syllabus.status = requestedStatus;
    if (Object.prototype.hasOwnProperty.call(payload, 'weeklyLessons')) syllabus.weeklyLessons = data.weeklyLessons;

    await syllabus.save();

    const Section = await resolveSectionModel();
    const populated = await Syllabus.findById(syllabus._id).populate(buildDetailPopulateOptions(Boolean(Section)));
    await logActivity(req, {
      action: 'Updated syllabus',
      module: 'Instruction',
      target: populated?._id || syllabus._id,
      status: 'Completed',
    });
    return res.status(200).json(populated.toJSON());
  } catch (err) {
    if (err && err.name === 'ValidationError') {
      return res.status(400).json({ message: 'Please check syllabus fields and try again.' });
    }
    return next(err);
  }
}

async function archiveSyllabus(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid syllabus id.' });
    }

    const syllabus = await Syllabus.findById(id);
    if (!syllabus) {
      return res.status(404).json({ message: 'Syllabus not found.' });
    }

    if (syllabus.status === 'Archived') {
      return res.status(400).json({ message: 'Syllabus is already archived.' });
    }

    if (syllabus.status === 'Active' && !isAdmin(req)) {
      return res.status(403).json({ message: 'Only admins can archive an active syllabus.' });
    }

    syllabus.status = 'Archived';
    await syllabus.save();
    await logActivity(req, {
      action: 'Archived syllabus',
      module: 'Instruction',
      target: syllabus._id,
      status: 'Completed',
    });

    return res.status(200).json({ message: 'Syllabus archived successfully.', syllabus: syllabus.toJSON() });
  } catch (err) {
    return next(err);
  }
}

async function updateWeeklyLesson(req, res, next) {
  try {
    /*
     * Instructor delivery timeline only — records when the syllabus instructor marked a planned week as taught.
     * Student attendance and participation are explicitly out of scope.
     */
    const { id, lessonId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid syllabus id.' });
    }
    if (!mongoose.Types.ObjectId.isValid(lessonId)) {
      return res.status(400).json({ message: 'Invalid lesson id.' });
    }

    const syllabus = await Syllabus.findById(id);
    if (!syllabus) {
      return res.status(404).json({ message: 'Syllabus not found.' });
    }
    if (syllabus.status === 'Archived') {
      return res.status(400).json({ message: 'Archived syllabi are read-only and cannot be updated.' });
    }

    const authzError = await assertCanManageWeeklyLessons(req, syllabus);
    if (authzError) {
      return res.status(authzError.status).json({ message: authzError.message });
    }

    const lesson = syllabus.weeklyLessons.id(lessonId);
    if (!lesson) {
      return res.status(404).json({ message: 'Weekly lesson not found.' });
    }

    const rawBody = req.body || {};
    const payload = { ...rawBody };
    delete payload.deliveredAt;
    delete payload.deliveredBy;

    const normalizedLesson = normalizeLessonPayload(payload, { allowPartial: true });
    const lessonError = validateLessonShape(normalizedLesson, { allowPartial: true });
    if (lessonError) {
      return res.status(400).json({ message: lessonError });
    }

    if (Object.prototype.hasOwnProperty.call(payload, 'weekNumber')) lesson.weekNumber = normalizedLesson.weekNumber;
    if (Object.prototype.hasOwnProperty.call(payload, 'topic')) lesson.topic = normalizedLesson.topic;
    if (Object.prototype.hasOwnProperty.call(payload, 'objectives')) lesson.objectives = normalizedLesson.objectives;
    if (Object.prototype.hasOwnProperty.call(payload, 'materials')) lesson.materials = normalizedLesson.materials;
    if (Object.prototype.hasOwnProperty.call(payload, 'assessments')) lesson.assessments = normalizedLesson.assessments;
    if (Object.prototype.hasOwnProperty.call(payload, 'timeAllocation')) {
      lesson.timeAllocation = normalizedLesson.timeAllocation;
    }

    if (Object.prototype.hasOwnProperty.call(payload, 'status')) {
      lesson.status = normalizedLesson.status;

      if (normalizedLesson.status === 'Delivered') {
        const bodyFacultyId = normalizeOptionalObjectId(rawBody.facultyId ?? rawBody.deliveredBy);
        if (!bodyFacultyId) {
          return res.status(400).json({ message: 'facultyId is required when marking a lesson as Delivered.' });
        }
        if (String(bodyFacultyId) !== String(syllabus.facultyId)) {
          return res.status(400).json({ message: 'facultyId must match the syllabus instructor.' });
        }

        const instructor = await Faculty.findById(syllabus.facultyId).select('_id').lean();
        if (!instructor) {
          return res.status(400).json({ message: 'Syllabus instructor record was not found.' });
        }

        lesson.deliveredAt = new Date();
        lesson.deliveredBy = syllabus.facultyId;
      } else if (normalizedLesson.status === 'Pending') {
        lesson.deliveredAt = null;
        lesson.deliveredBy = null;
      }
    }

    const sequenceError = validateSequentialWeekNumbers(syllabus.weeklyLessons);
    if (sequenceError) {
      return res.status(400).json({ message: sequenceError });
    }

    await syllabus.save();
    await logActivity(req, {
      action: 'Updated weekly lesson',
      module: 'Instruction',
      target: syllabus._id,
      status: 'Completed',
    });
    return res.status(200).json(lesson.toJSON());
  } catch (err) {
    if (err && err.name === 'ValidationError') {
      return res.status(400).json({ message: 'Please check weekly lesson fields and try again.' });
    }
    return next(err);
  }
}

async function cloneSyllabus(req, res, next) {
  try {
    const { sourceSyllabusId, targetSectionId, facultyId } = req.body;
    if (!mongoose.Types.ObjectId.isValid(sourceSyllabusId)) {
      return res.status(400).json({ message: 'Invalid source syllabus id.' });
    }
    const source = await Syllabus.findById(sourceSyllabusId).lean();
    if (!source) return res.status(404).json({ message: 'Source syllabus not found.' });

    const Section = await resolveSectionModel();
    if (!Section) return res.status(503).json({ message: 'Scheduling module is not available.' });

    const section = await Section.findById(targetSectionId).lean();
    if (!section) return res.status(404).json({ message: 'Target section not found.' });

    const targetFacultyId = facultyId || source.facultyId;

    const duplicate = await Syllabus.findOne({
      sectionId: targetSectionId,
      facultyId: targetFacultyId,
      status: { $in: ['Draft', 'Active'] },
    });
    if (duplicate) {
      return res.status(409).json({ message: 'A draft or active syllabus already exists for this section and faculty.' });
    }

    const newSyllabusData = {
      curriculumId: section.curriculumId,
      facultyId: targetFacultyId,
      sectionId: targetSectionId,
      description: source.description,
      gradingSystem: source.gradingSystem,
      coursePolicies: source.coursePolicies,
      status: 'Draft',
      weeklyLessons: (source.weeklyLessons || []).map((l) => ({
        weekNumber: l.weekNumber,
        topic: l.topic,
        objectives: l.objectives,
        materials: l.materials,
        assessments: l.assessments,
        timeAllocation: l.timeAllocation,
        status: 'Pending',
        deliveredAt: null,
        deliveredBy: null,
      })),
    };

    const created = await Syllabus.create(newSyllabusData);
    await logActivity(req, {
      action: 'Cloned syllabus',
      module: 'Instruction',
      target: created._id,
      status: 'Completed',
    });

    return res.status(201).json(created.toJSON());
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  getSyllabi,
  getSyllabusById,
  createSyllabus,
  updateSyllabus,
  archiveSyllabus,
  updateWeeklyLesson,
  cloneSyllabus,
};
