const mongoose = require('mongoose');
const Curriculum = require('../models/Curriculum');
const TimeBlock = require('../models/TimeBlock');
const Room = require('../models/Room');

const DAY_ENUM = TimeBlock.DAY_ENUM || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const STATUS_ENUM = TimeBlock.STATUS_ENUM || ['Active', 'Archived'];

const TIME_RE = /^([01]?\d|2[0-3]):([0-5]\d)$/;

function normalizeString(value) {
  return String(value ?? '').trim();
}

/** Escape user input so it is matched literally in RegExp */
function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeOptionalObjectId(value) {
  if (value == null || value === '') return null;
  return mongoose.Types.ObjectId.isValid(value) ? new mongoose.Types.ObjectId(value) : null;
}

function parseTimeToMinutes(value) {
  const m = TIME_RE.exec(normalizeString(value));
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (!Number.isInteger(h) || h < 0 || h > 23) return null;
  if (!Number.isInteger(min) || min < 0 || min > 59) return null;
  return h * 60 + min;
}

/**
 * Enforces startTime + durationMinutes === endTime for same-calendar-day slots (institutional day bounds).
 */
function validateStartDurationEnd(startTime, endTime, durationMinutes) {
  const start = parseTimeToMinutes(startTime);
  const end = parseTimeToMinutes(endTime);
  if (start == null || end == null) {
    return 'startTime and endTime must use HH:mm (24-hour, e.g. 08:30 or 14:00).';
  }
  const dur = Number(durationMinutes);
  if (!Number.isFinite(dur) || !Number.isInteger(dur) || dur < 1) {
    return 'durationMinutes must be a positive integer (minutes).';
  }
  if (start + dur !== end) {
    return 'startTime plus durationMinutes must exactly equal endTime.';
  }
  return null;
}

function normalizeDays(value) {
  if (!Array.isArray(value)) return [];
  const seen = new Set();
  const out = [];
  for (const d of value) {
    const day = normalizeString(d);
    if (!DAY_ENUM.includes(day)) continue;
    if (!seen.has(day)) {
      seen.add(day);
      out.push(day);
    }
  }
  return out.sort((a, b) => DAY_ENUM.indexOf(a) - DAY_ENUM.indexOf(b));
}

/**
 * When a curriculum is assigned, ensure block length fits weekly lecture/lab minute budgets from the Curriculum module.
 */
async function validateCurriculumBounds(curriculumId, durationMinutes) {
  if (!curriculumId) return null;
  const curriculum = await Curriculum.findById(curriculumId).select('lectureHours labHours status').lean();
  if (!curriculum) return 'Referenced curriculum was not found.';
  if (normalizeString(curriculum.status) !== 'Active') {
    return 'Curriculum must be Active when assigned to a time block.';
  }

  const lecMin = Math.round(Number(curriculum.lectureHours || 0) * 60);
  const labMin = Math.round(Number(curriculum.labHours || 0) * 60);
  if (lecMin <= 0 && labMin <= 0) {
    return 'Curriculum has no lecture or lab hours; set hours before binding this time block.';
  }

  const maxPerSession = Math.max(lecMin, labMin);
  const totalWeeklyContact = lecMin + labMin;
  const dur = Number(durationMinutes);

  if (dur > maxPerSession) {
    return `Block duration (${dur} min) cannot exceed the curriculum weekly lecture/lab ceiling used for scheduling (${maxPerSession} min).`;
  }
  if (dur > totalWeeklyContact) {
    return `Block duration (${dur} min) cannot exceed combined weekly lecture and lab minutes (${totalWeeklyContact} min).`;
  }

  return null;
}

function buildPayload(body, { partial = false } = {}) {
  const raw = body || {};
  const data = {};

  if (!partial || Object.prototype.hasOwnProperty.call(raw, 'label')) {
    data.label = normalizeString(raw.label);
  }
  if (!partial || Object.prototype.hasOwnProperty.call(raw, 'durationMinutes')) {
    data.durationMinutes = raw.durationMinutes == null ? null : Number(raw.durationMinutes);
  }
  if (!partial || Object.prototype.hasOwnProperty.call(raw, 'daysOfWeek')) {
    data.daysOfWeek = normalizeDays(raw.daysOfWeek);
  }
  if (!partial || Object.prototype.hasOwnProperty.call(raw, 'startTime')) {
    data.startTime = normalizeString(raw.startTime);
  }
  if (!partial || Object.prototype.hasOwnProperty.call(raw, 'endTime')) {
    data.endTime = normalizeString(raw.endTime);
  }
  if (!partial || Object.prototype.hasOwnProperty.call(raw, 'status')) {
    data.status = raw.status == null ? 'Active' : normalizeString(raw.status);
  }
  if (!partial || Object.prototype.hasOwnProperty.call(raw, 'curriculumId')) {
    data.curriculumId = normalizeOptionalObjectId(raw.curriculumId);
  }

  return data;
}

function validatePayload(data, { isCreate = false, existing = null } = {}) {
  const merged = isCreate
    ? { ...data }
    : {
        label: data.label != null ? data.label : existing.label,
        durationMinutes: data.durationMinutes != null ? data.durationMinutes : existing.durationMinutes,
        daysOfWeek: data.daysOfWeek != null ? data.daysOfWeek : existing.daysOfWeek,
        startTime: data.startTime != null ? data.startTime : existing.startTime,
        endTime: data.endTime != null ? data.endTime : existing.endTime,
        status: data.status != null ? data.status : existing.status,
        curriculumId: Object.prototype.hasOwnProperty.call(data, 'curriculumId')
          ? data.curriculumId
          : existing.curriculumId,
      };

  if (isCreate || data.label != null) {
    if (!merged.label) return 'label is required.';
  }
  if (isCreate || data.durationMinutes != null) {
    if (!Number.isFinite(merged.durationMinutes) || !Number.isInteger(merged.durationMinutes) || merged.durationMinutes < 1) {
      return 'durationMinutes must be a positive integer.';
    }
  }
  if (isCreate || data.daysOfWeek != null) {
    if (!merged.daysOfWeek.length) return 'At least one dayOfWeek is required.';
    for (const d of merged.daysOfWeek) {
      if (!DAY_ENUM.includes(d)) {
        return `Invalid dayOfWeek "${d}". Use Mon–Sun.`;
      }
    }
    if (merged.daysOfWeek.length !== new Set(merged.daysOfWeek).size) {
      return 'daysOfWeek must not contain duplicates.';
    }
  }
  if (isCreate || data.startTime != null || data.endTime != null || data.durationMinutes != null) {
    const timeErr = validateStartDurationEnd(merged.startTime, merged.endTime, merged.durationMinutes);
    if (timeErr) return timeErr;
  }
  if (merged.status != null && merged.status !== '' && !STATUS_ENUM.includes(merged.status)) {
    return `status must be one of: ${STATUS_ENUM.join(', ')}.`;
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

async function listSections(req, res, next) {
  try {
    const { status, facultyId, curriculumId } = req.query;
    const Section = await resolveSectionModel();
    if (!Section) {
      return res.status(503).json({ message: 'Scheduling module is not available.' });
    }

    const query = {};

    if (status) {
      const normalized = normalizeString(status);
      if (!['Open', 'Closed', 'Waitlisted', 'Archived', 'All'].includes(normalized)) {
        return res.status(400).json({ message: 'status must be Open, Closed, Waitlisted, Archived, or All.' });
      }
      if (normalized !== 'All') {
        query.status = normalized;
      }
    }

    if (curriculumId) {
      if (!mongoose.Types.ObjectId.isValid(curriculumId)) {
        return res.status(400).json({ message: 'curriculumId must be a valid ObjectId.' });
      }
      query.curriculumId = curriculumId;
    }

    const sections = await Section.find(query)
      .populate('curriculumId', 'courseCode courseTitle curriculumYear creditUnits courseLearningOutcomes status')
      .sort({ academicYear: -1, term: -1, updatedAt: -1 });

    return res.status(200).json(sections.map((row) => row.toJSON()));
  } catch (err) {
    return next(err);
  }
}

async function listTimeBlocks(_req, res, next) {
  try {
    const rows = await TimeBlock.find({ status: 'Active' })
      .populate('curriculumId', 'courseCode courseTitle lectureHours labHours status')
      .sort({ label: 1 });
    return res.status(200).json(rows.map((row) => row.toJSON()));
  } catch (err) {
    return next(err);
  }
}

async function createTimeBlock(req, res, next) {
  try {
    const payload = buildPayload(req.body, { partial: false });
    const err = validatePayload(payload, { isCreate: true });
    if (err) return res.status(400).json({ message: err });

    if (payload.curriculumId) {
      const curErr = await validateCurriculumBounds(payload.curriculumId, payload.durationMinutes);
      if (curErr) return res.status(400).json({ message: curErr });
    }

    const created = await TimeBlock.create({
      label: payload.label,
      durationMinutes: payload.durationMinutes,
      daysOfWeek: payload.daysOfWeek,
      startTime: payload.startTime,
      endTime: payload.endTime,
      status: 'Active',
      curriculumId: payload.curriculumId,
    });
    const populated = await TimeBlock.findById(created._id).populate(
      'curriculumId',
      'courseCode courseTitle lectureHours labHours status',
    );
    return res.status(201).json(populated.toJSON());
  } catch (err) {
    if (err && err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message || 'Invalid time block.' });
    }
    return next(err);
  }
}

async function updateTimeBlock(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid time block id.' });
    }

    const existing = await TimeBlock.findById(id);
    if (!existing) {
      return res.status(404).json({ message: 'Time block not found.' });
    }
    if (existing.status === 'Archived') {
      return res.status(400).json({ message: 'Archived time blocks cannot be updated.' });
    }

    const payload = buildPayload(req.body, { partial: true });
    if (payload.status != null && payload.status === 'Archived') {
      return res.status(400).json({ message: 'Use DELETE /api/scheduling/timeblocks/:id to archive a time block.' });
    }
    const err = validatePayload(payload, { isCreate: false, existing });
    if (err) return res.status(400).json({ message: err });

    const mergedDuration = payload.durationMinutes != null ? payload.durationMinutes : existing.durationMinutes;
    const mergedCurriculum = Object.prototype.hasOwnProperty.call(payload, 'curriculumId')
      ? payload.curriculumId
      : existing.curriculumId;

    if (mergedCurriculum) {
      const curErr = await validateCurriculumBounds(mergedCurriculum, mergedDuration);
      if (curErr) return res.status(400).json({ message: curErr });
    }

    if (payload.label != null) existing.label = payload.label;
    if (payload.durationMinutes != null) existing.durationMinutes = payload.durationMinutes;
    if (payload.daysOfWeek != null) existing.daysOfWeek = payload.daysOfWeek;
    if (payload.startTime != null) existing.startTime = payload.startTime;
    if (payload.endTime != null) existing.endTime = payload.endTime;
    if (payload.status != null && payload.status !== '') existing.status = payload.status;
    if (Object.prototype.hasOwnProperty.call(payload, 'curriculumId')) {
      existing.curriculumId = payload.curriculumId;
    }

    await existing.save();
    const populated = await TimeBlock.findById(existing._id).populate(
      'curriculumId',
      'courseCode courseTitle lectureHours labHours status',
    );
    return res.status(200).json(populated.toJSON());
  } catch (err) {
    if (err && err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message || 'Invalid time block.' });
    }
    return next(err);
  }
}

async function archiveTimeBlock(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid time block id.' });
    }

    const row = await TimeBlock.findById(id);
    if (!row) {
      return res.status(404).json({ message: 'Time block not found.' });
    }
    if (row.status === 'Archived') {
      return res.status(400).json({ message: 'Time block is already archived.' });
    }

    row.status = 'Archived';
    await row.save();
    return res.status(200).json({ message: 'Time block archived.', timeBlock: row.toJSON() });
  } catch (err) {
    return next(err);
  }
}

async function createSection(req, res, next) {
  try {
    const Section = await resolveSectionModel();
    if (!Section) {
      return res.status(503).json({ message: 'Scheduling module is not available.' });
    }

    const { curriculumId, term, academicYear } = req.body;
    if (!curriculumId) return res.status(400).json({ message: 'curriculumId is required.' });
    if (!term) return res.status(400).json({ message: 'term is required.' });
    if (!academicYear) return res.status(400).json({ message: 'academicYear is required.' });

    const curriculum = await Curriculum.findById(curriculumId);
    if (!curriculum) return res.status(404).json({ message: 'Curriculum not found.' });
    if (curriculum.status !== 'Active') {
      return res.status(400).json({ message: 'Curriculum is not active.' });
    }

    const count = await Section.countDocuments({ curriculumId, term, academicYear });
    const sectionIndex = count + 1;
    
    // Generate an identifier autonomously
    const courseCode = normalizeString(curriculum.courseCode).toUpperCase().replace(/\s+/g, '-');
    const termCode = term.substring(0, 2).toUpperCase();
    const yearSuffix = academicYear.length > 2 ? academicYear.substring(academicYear.length - 2) : academicYear;

    const sectionIdentifier = `${courseCode}-${termCode}${yearSuffix}-S${sectionIndex}`;

    const newSection = new Section({
      sectionIdentifier,
      curriculumId,
      term,
      academicYear,
      status: 'Open',
      currentEnrollmentCount: 0,
      schedules: [],
    });

    await newSection.save();

    const populated = await Section.findById(newSection._id).populate(
      'curriculumId',
      'courseCode courseTitle curriculumYear creditUnits courseLearningOutcomes status'
    );

    return res.status(201).json(populated.toJSON());
  } catch (err) {
    if (err && err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message || 'Invalid section data.' });
    }
    if (err && err.code === 11000) {
      return res.status(400).json({ message: 'Section identifier already exists. Please try again.' });
    }
    return next(err);
  }
}

async function updateSectionResources(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid section id.' });
    }

    const { schedules } = req.body;
    if (!Array.isArray(schedules)) {
      return res.status(400).json({ message: 'schedules must be an array.' });
    }

    const Section = await resolveSectionModel();
    if (!Section) {
      return res.status(503).json({ message: 'Scheduling module is not available.' });
    }

    const section = await Section.findById(id);
    if (!section) return res.status(404).json({ message: 'Section not found.' });
    if (section.status === 'Archived') {
      return res.status(400).json({ message: 'Archived sections cannot be modified.' });
    }

    // Validation & Conflict Check
    const activeSections = await Section.find({
      term: section.term,
      academicYear: section.academicYear,
      _id: { $ne: section._id },
      status: { $in: ['Open', 'Waitlisted', 'Closed'] },
    });

    for (let i = 0; i < schedules.length; i++) {
      const s = schedules[i];
      const nStart = parseTimeToMinutes(s.startTime);
      const nEnd = parseTimeToMinutes(s.endTime);

      if (nStart == null || nEnd == null) {
        return res.status(400).json({ message: 'Invalid startTime or endTime format. Use HH:mm.' });
      }
      if (nStart >= nEnd) {
        return res.status(400).json({ message: 'startTime must be before endTime.' });
      }

      // Check intra-schedule conflicts (within the new payload itself)
      for (let j = i + 1; j < schedules.length; j++) {
        const s2 = schedules[j];
        if (s.dayOfWeek === s2.dayOfWeek) {
          const s2Start = parseTimeToMinutes(s2.startTime);
          const s2End = parseTimeToMinutes(s2.endTime);
          if (nStart < s2End && nEnd > s2Start) {
            return res.status(409).json({
              message: 'Conflict detected within the new schedules payload.',
              conflictType: 'INTERNAL_SCHEDULE_CONFLICT',
              sectionIdentifier: section.sectionIdentifier,
            });
          }
        }
      }

      // Check external system state conflicts
      for (const existingSec of activeSections) {
        if (!existingSec.schedules || !Array.isArray(existingSec.schedules)) continue;

        for (const ex of existingSec.schedules) {
          if (s.dayOfWeek !== ex.dayOfWeek) continue;

          const eStart = parseTimeToMinutes(ex.startTime);
          const eEnd = parseTimeToMinutes(ex.endTime);

          if (eStart == null || eEnd == null) continue;

          if (nStart < eEnd && nEnd > eStart) {
            if (s.roomId && ex.roomId && s.roomId.toString() === ex.roomId.toString()) {
              return res.status(409).json({
                message: 'Conflict detected: Room is already booked for this time.',
                conflictType: 'ROOM_DOUBLE_BOOKED',
                sectionIdentifier: existingSec.sectionIdentifier,
              });
            }
            if (s.facultyId && ex.facultyId && s.facultyId.toString() === ex.facultyId.toString()) {
              return res.status(409).json({
                message: 'Conflict detected: Faculty is already booked for this time.',
                conflictType: 'FACULTY_DOUBLE_BOOKED',
                sectionIdentifier: existingSec.sectionIdentifier,
              });
            }
          }
        }
      }
    }

    // Replace the existing schedules with the new ones provided
    section.schedules = schedules;
    await section.save();

    const populated = await Section.findById(id)
      .populate('curriculumId', 'courseCode courseTitle curriculumYear creditUnits courseLearningOutcomes status')
      .populate('schedules.roomId', 'name roomType maximumCapacity status')
      .populate('schedules.facultyId', 'employeeId firstName lastName department status');

    return res.status(200).json(populated.toJSON());
  } catch (err) {
    if (err && err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message || 'Invalid schedules data.' });
    }
    return next(err);
  }
}

async function getScheduleMatrix(req, res, next) {
  try {
    const { term, academicYear } = req.query;
    if (!term) return res.status(400).json({ message: 'term is required.' });
    if (!academicYear) return res.status(400).json({ message: 'academicYear is required.' });

    const Section = await resolveSectionModel();
    if (!Section) {
      return res.status(503).json({ message: 'Scheduling module is not available.' });
    }

    const sections = await Section.find({ 
      term,
      academicYear,
      status: { $in: ['Open', 'Waitlisted', 'Closed'] },
    })
      .populate('curriculumId', 'courseCode courseTitle')
      .populate('schedules.roomId', 'name maximumCapacity')
      .populate('schedules.facultyId', 'firstName lastName employeeId');

    const matrixEvents = [];
    sections.forEach((sec) => {
      if (sec.schedules && Array.isArray(sec.schedules)) {
        sec.schedules.forEach((sched) => {
          matrixEvents.push({
            sectionId: sec._id,
            sectionIdentifier: sec.sectionIdentifier,
            courseCode: sec.curriculumId?.courseCode,
            courseTitle: sec.curriculumId?.courseTitle,
            roomId: sched.roomId?._id,
            roomName: sched.roomId?.name,
            facultyId: sched.facultyId?._id,
            facultyName: sched.facultyId ? `${sched.facultyId.firstName} ${sched.facultyId.lastName}` : 'Unassigned',
            dayOfWeek: sched.dayOfWeek,
            startTime: sched.startTime,
            endTime: sched.endTime,
          });
        });
      }
    });

    return res.status(200).json(matrixEvents);
  } catch (err) {
    return next(err);
  }
}

async function getRoomUtilization(req, res, next) {
  try {
    const { term, academicYear } = req.query;
    if (!term) return res.status(400).json({ message: 'term is required.' });
    if (!academicYear) return res.status(400).json({ message: 'academicYear is required.' });

    const Section = await resolveSectionModel();

    // Get all active rooms first to ensure we account for empty ones
    const allActiveRooms = await Room.find({ status: 'Active' }).lean();

    // Aggregation pipeline for calculating total hours per room from sections
    const pipeline = [
      {
        $match: {
          term,
          academicYear,
          status: { $in: ['Open', 'Waitlisted', 'Closed'] }
        }
      },
      { $unwind: '$schedules' },
      {
        $group: {
          _id: '$schedules.roomId',
          totalMinutes: {
            $sum: {
              $subtract: [
                {
                  $add: [
                    { $multiply: [{ $toInt: { $substr: ['$schedules.endTime', 0, 2] } }, 60] },
                    { $toInt: { $substr: ['$schedules.endTime', 3, 2] } }
                  ]
                },
                {
                  $add: [
                    { $multiply: [{ $toInt: { $substr: ['$schedules.startTime', 0, 2] } }, 60] },
                    { $toInt: { $substr: ['$schedules.startTime', 3, 2] } }
                  ]
                }
              ]
            }
          },
          schedules: {
            $push: {
              dayOfWeek: '$schedules.dayOfWeek',
              startTime: '$schedules.startTime',
              endTime: '$schedules.endTime',
              sectionIdentifier: '$sectionIdentifier'
            }
          }
        }
      }
    ];

    const utilizationData = await Section.aggregate(pipeline);

    // Merge everything into the list of all active rooms
    const result = allActiveRooms.map((room) => {
      const stats = utilizationData.find((u) => String(u._id) === String(room._id));
      const totalMinutes = stats ? stats.totalMinutes : 0;
      
      return {
        roomId: room._id,
        roomName: room.name,
        roomType: room.type,
        maximumCapacity: room.maximumCapacity,
        totalScheduledHours: totalMinutes / 60,
        utilizationPercentage: (totalMinutes / 3600) * 100, // 60 hrs theoretical max
        schedules: stats ? stats.schedules : [],
      };
    });

    // Sort by utilization percentage descending
    result.sort((a, b) => b.utilizationPercentage - a.utilizationPercentage);

    return res.status(200).json(result);
  } catch (err) {
    return next(err);
  }
}

async function resolveFacultyForSchedulingUser(req) {
  const User = mongoose.model('User');
  const Faculty = mongoose.model('Faculty');

  const user = await User.findById(req.user.id);
  if (!user || user.role !== 'faculty') {
    return { ok: false, status: 403, message: 'Access denied: Must be authenticated as a faculty member.' };
  }

  const fromJwt = req.user.employeeId != null ? String(req.user.employeeId).trim() : '';
  const fromDb = user.employeeId != null ? String(user.employeeId).trim() : '';
  const fromUsername = user.username != null ? String(user.username).trim() : '';
  const lookupKey = fromJwt || fromDb || fromUsername;
  if (!lookupKey) {
    return { ok: false, status: 404, message: 'Faculty profile not found for this user.' };
  }
  const faculty = await Faculty.findOne({
    employeeId: new RegExp(`^${escapeRegex(lookupKey)}$`, 'i'),
  });
  if (!faculty) {
    return { ok: false, status: 404, message: 'Faculty profile not found for this user.' };
  }
  return { ok: true, faculty };
}

/**
 * Unique sections the faculty teaches: from timetable assignments and/or syllabi linked to a section.
 */
async function getMyClasses(req, res, next) {
  try {
    const { term } = req.query;
    const resolved = await resolveFacultyForSchedulingUser(req);
    if (!resolved.ok) {
      return res.status(resolved.status).json({ message: resolved.message });
    }
    const { faculty } = resolved;

    const Section = await resolveSectionModel();
    if (!Section) {
      return res.status(503).json({ message: 'Scheduling module is not available.' });
    }

    const { Syllabus: SyllabusModel } = require('../models/Syllabus');

    const baseQuery = {
      status: { $in: ['Open', 'Waitlisted', 'Closed'] },
    };
    if (term) {
      baseQuery.term = term;
    }

    const sectionIdSet = new Set();

    const sectionsWithFaculty = await Section.find({
      ...baseQuery,
      schedules: { $elemMatch: { facultyId: faculty._id } },
    })
      .select('_id')
      .lean();
    sectionsWithFaculty.forEach((s) => sectionIdSet.add(s._id.toString()));

    const syllabiWithSections = await SyllabusModel.find({
      facultyId: faculty._id,
      sectionId: { $ne: null },
    })
      .select('sectionId _id')
      .lean();

    const syllabusBySectionId = new Map();
    for (const syll of syllabiWithSections) {
      const sid = syll.sectionId.toString();
      sectionIdSet.add(sid);
      syllabusBySectionId.set(sid, syll._id.toString());
    }

    if (sectionIdSet.size === 0) {
      return res.status(200).json([]);
    }

    const sectionQuery = {
      _id: { $in: [...sectionIdSet].map((id) => new mongoose.Types.ObjectId(id)) },
      ...baseQuery,
    };

    const sections = await Section.find(sectionQuery)
      .populate('curriculumId', 'courseCode courseTitle')
      .sort({ academicYear: -1, term: 1, sectionIdentifier: 1 })
      .lean();

    const rows = sections.map((sec) => ({
      sectionId: sec._id.toString(),
      sectionIdentifier: sec.sectionIdentifier,
      term: sec.term,
      academicYear: sec.academicYear,
      courseCode: sec.curriculumId?.courseCode,
      courseTitle: sec.curriculumId?.courseTitle,
      syllabusId: syllabusBySectionId.get(sec._id.toString()) || null,
      enrolledCount: Array.isArray(sec.enrolledStudentIds) ? sec.enrolledStudentIds.length : 0,
    }));

    return res.status(200).json(rows);
  } catch (err) {
    return next(err);
  }
}

async function getMySchedule(req, res, next) {
  try {
    const { term } = req.query; // optional term filter
    const resolved = await resolveFacultyForSchedulingUser(req);
    if (!resolved.ok) {
      return res.status(resolved.status).json({ message: resolved.message });
    }
    const { faculty } = resolved;

    const Section = await resolveSectionModel();
    const query = { status: { $in: ['Open', 'Waitlisted', 'Closed'] } };
    if (term) query.term = term;

    const sections = await Section.find(query)
      .populate('curriculumId', 'courseCode courseTitle')
      .populate('schedules.roomId', 'name');

    const SyllabusModel = mongoose.models.Syllabus || (await (async () => {
       try { 
         const m = require('../models/Syllabus'); 
         return m.Syllabus || m; 
       } catch { return null; } 
    })());

    const myEvents = [];
    for (const sec of sections) {
      if (!sec.schedules || !Array.isArray(sec.schedules)) continue;
      
      let secSyllabusId = null;
      if (SyllabusModel) {
        const syllabus = await SyllabusModel.findOne({ sectionId: sec._id, facultyId: faculty._id }).lean();
        if (syllabus) secSyllabusId = syllabus._id.toString();
      }

      for (const sched of sec.schedules) {
        if (sched.facultyId && sched.facultyId.toString() === faculty._id.toString()) {
          myEvents.push({
            sectionId: sec._id.toString(),
            sectionIdentifier: sec.sectionIdentifier,
            term: sec.term,
            academicYear: sec.academicYear,
            courseCode: sec.curriculumId?.courseCode,
            courseTitle: sec.curriculumId?.courseTitle,
            roomId: sched.roomId?._id,
            roomName: sched.roomId?.name || 'TBA',
            dayOfWeek: sched.dayOfWeek,
            startTime: sched.startTime,
            endTime: sched.endTime,
            syllabusId: secSyllabusId
          });
        }
      }
    }

    return res.status(200).json(myEvents);
  } catch (err) {
    return next(err);
  }
}

async function facultyTeachesSection(facultyMongoId, sectionDoc) {
  const fid = String(facultyMongoId);
  const has = Array.isArray(sectionDoc.schedules)
    && sectionDoc.schedules.some((s) => s.facultyId && String(s.facultyId) === fid);
  if (has) return true;
  const { Syllabus: SyllabusModel } = require('../models/Syllabus');
  const syll = await SyllabusModel.findOne({ sectionId: sectionDoc._id, facultyId: facultyMongoId })
    .select('_id')
    .lean();
  return Boolean(syll);
}

async function assertStaffCanManageSectionRoster(req, sectionDoc) {
  if (req.user?.role === 'admin') return { ok: true };
  if (req.user?.role !== 'faculty') {
    return { ok: false, status: 403, message: 'Access denied.' };
  }
  const resolved = await resolveFacultyForSchedulingUser(req);
  if (!resolved.ok) return { ok: false, status: resolved.status, message: resolved.message };
  const teaches = await facultyTeachesSection(resolved.faculty._id, sectionDoc);
  if (!teaches) {
    return { ok: false, status: 403, message: 'You are not assigned to this section.' };
  }
  return { ok: true };
}

async function resolveStudentObjectIdsFromBody(ids) {
  const Student = require('../models/Student');
  const out = [];
  const seen = new Set();
  if (!Array.isArray(ids)) return out;
  for (const raw of ids) {
    const s = String(raw ?? '').trim();
    if (!s) continue;
    let doc = null;
    if (mongoose.Types.ObjectId.isValid(s)) {
      doc = await Student.findById(s);
    }
    if (!doc) doc = await Student.findOne({ id: s });
    if (doc && !seen.has(doc._id.toString())) {
      seen.add(doc._id.toString());
      out.push(doc._id);
    }
  }
  return out;
}

async function getSectionRoster(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid section id.' });
    }
    const Section = await resolveSectionModel();
    if (!Section) return res.status(503).json({ message: 'Scheduling module is not available.' });

    const section = await Section.findById(id).populate('curriculumId', 'courseCode courseTitle').lean();
    if (!section) return res.status(404).json({ message: 'Section not found.' });

    const gate = await assertStaffCanManageSectionRoster(req, section);
    if (!gate.ok) return res.status(gate.status).json({ message: gate.message });

    const Student = require('../models/Student');
    const ids = Array.isArray(section.enrolledStudentIds) ? section.enrolledStudentIds : [];
    const docs = await Student.find({ _id: { $in: ids } }).lean();
    const byId = new Map(docs.map((d) => [d._id.toString(), d]));
    const ordered = ids.map((oid) => byId.get(String(oid))).filter(Boolean);

    return res.status(200).json({
      section: {
        sectionId: section._id.toString(),
        sectionIdentifier: section.sectionIdentifier,
        term: section.term,
        academicYear: section.academicYear,
        courseCode: section.curriculumId?.courseCode,
        courseTitle: section.curriculumId?.courseTitle,
      },
      students: ordered.map((st) => ({
        _id: st._id.toString(),
        id: st.id,
        firstName: st.firstName,
        lastName: st.lastName,
        program: st.program,
        yearLevel: st.yearLevel,
        email: st.email,
        status: st.status,
      })),
    });
  } catch (err) {
    return next(err);
  }
}

async function patchSectionRoster(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid section id.' });
    }
    const Section = await resolveSectionModel();
    if (!Section) return res.status(503).json({ message: 'Scheduling module is not available.' });

    const section = await Section.findById(id);
    if (!section) return res.status(404).json({ message: 'Section not found.' });
    if (section.status === 'Archived') {
      return res.status(400).json({ message: 'Cannot modify roster for an archived section.' });
    }

    const gate = await assertStaffCanManageSectionRoster(req, section);
    if (!gate.ok) return res.status(gate.status).json({ message: gate.message });

    const add = req.body?.add;
    const remove = req.body?.remove;
    if (!Array.isArray(add) && !Array.isArray(remove)) {
      return res.status(400).json({ message: 'Provide add and/or remove as arrays of student ids.' });
    }

    const addIds = await resolveStudentObjectIdsFromBody(Array.isArray(add) ? add : []);
    const removeIds = await resolveStudentObjectIdsFromBody(Array.isArray(remove) ? remove : []);

    const set = new Set((section.enrolledStudentIds || []).map((x) => x.toString()));
    for (const r of removeIds) set.delete(r.toString());
    for (const a of addIds) set.add(a.toString());

    section.enrolledStudentIds = [...set].map((s) => new mongoose.Types.ObjectId(s));
    section.currentEnrollmentCount = section.enrolledStudentIds.length;
    await section.save();

    const populated = await Section.findById(id).populate('curriculumId', 'courseCode courseTitle').lean();
    const Student = require('../models/Student');
    const ids2 = populated.enrolledStudentIds || [];
    const docs = await Student.find({ _id: { $in: ids2 } }).lean();
    const byId = new Map(docs.map((d) => [d._id.toString(), d]));
    const ordered = ids2.map((oid) => byId.get(String(oid))).filter(Boolean);

    return res.status(200).json({
      section: {
        sectionId: populated._id.toString(),
        sectionIdentifier: populated.sectionIdentifier,
        term: populated.term,
        academicYear: populated.academicYear,
        courseCode: populated.curriculumId?.courseCode,
        courseTitle: populated.curriculumId?.courseTitle,
        enrolledCount: ordered.length,
      },
      students: ordered.map((st) => ({
        _id: st._id.toString(),
        id: st.id,
        firstName: st.firstName,
        lastName: st.lastName,
        program: st.program,
        yearLevel: st.yearLevel,
        email: st.email,
        status: st.status,
      })),
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  listSections,
  createSection,
  updateSectionResources,
  getScheduleMatrix,
  getRoomUtilization,
  getMyClasses,
  getMySchedule,
  getSectionRoster,
  patchSectionRoster,
  listTimeBlocks,
  createTimeBlock,
  updateTimeBlock,
  archiveTimeBlock,
};
