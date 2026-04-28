const mongoose = require("mongoose");
const Curriculum = require("../models/Curriculum");
const TimeBlock = require("../models/TimeBlock");
const Room = require("../models/Room");
const { logActivity } = require("../services/activityLogService");
const {
  resolveFacultyForUser,
  facultyTeachesSection: facultyTeachesSectionScoped,
  assertFacultySectionAccess,
} = require("../services/facultyPermissionsService");
const Student = require("../models/Student");
const { Syllabus } = require("../models/Syllabus");
const ClassAttendance = require("../models/ClassAttendance");

const DAY_ENUM = TimeBlock.DAY_ENUM || [
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
  "Sun",
];
const STATUS_ENUM = TimeBlock.STATUS_ENUM || ["Active", "Archived"];

const TIME_RE = /^([01]?\d|2[0-3]):([0-5]\d)$/;

function normalizeString(value) {
  return String(value ?? "").trim();
}

function normalizeOptionalObjectId(value) {
  if (value == null || value === "") return null;
  return mongoose.Types.ObjectId.isValid(value)
    ? new mongoose.Types.ObjectId(value)
    : null;
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
    return "startTime and endTime must use HH:mm (24-hour, e.g. 08:30 or 14:00).";
  }
  const dur = Number(durationMinutes);
  if (!Number.isFinite(dur) || !Number.isInteger(dur) || dur < 1) {
    return "durationMinutes must be a positive integer (minutes).";
  }
  if (start + dur !== end) {
    return "startTime plus durationMinutes must exactly equal endTime.";
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
  const curriculum = await Curriculum.findById(curriculumId)
    .select("lectureHours labHours status")
    .lean();
  if (!curriculum) return "Referenced curriculum was not found.";
  if (normalizeString(curriculum.status) !== "Active") {
    return "Curriculum must be Active when assigned to a time block.";
  }

  const lecMin = Math.round(Number(curriculum.lectureHours || 0) * 60);
  const labMin = Math.round(Number(curriculum.labHours || 0) * 60);
  if (lecMin <= 0 && labMin <= 0) {
    return "Curriculum has no lecture or lab hours; set hours before binding this time block.";
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

  if (!partial || Object.prototype.hasOwnProperty.call(raw, "label")) {
    data.label = normalizeString(raw.label);
  }
  if (
    !partial ||
    Object.prototype.hasOwnProperty.call(raw, "durationMinutes")
  ) {
    data.durationMinutes =
      raw.durationMinutes == null ? null : Number(raw.durationMinutes);
  }
  if (!partial || Object.prototype.hasOwnProperty.call(raw, "daysOfWeek")) {
    data.daysOfWeek = normalizeDays(raw.daysOfWeek);
  }
  if (!partial || Object.prototype.hasOwnProperty.call(raw, "startTime")) {
    data.startTime = normalizeString(raw.startTime);
  }
  if (!partial || Object.prototype.hasOwnProperty.call(raw, "endTime")) {
    data.endTime = normalizeString(raw.endTime);
  }
  if (!partial || Object.prototype.hasOwnProperty.call(raw, "status")) {
    data.status = raw.status == null ? "Active" : normalizeString(raw.status);
  }
  if (!partial || Object.prototype.hasOwnProperty.call(raw, "curriculumId")) {
    data.curriculumId = normalizeOptionalObjectId(raw.curriculumId);
  }

  return data;
}

function validatePayload(data, { isCreate = false, existing = null } = {}) {
  const merged = isCreate
    ? { ...data }
    : {
        label: data.label != null ? data.label : existing.label,
        durationMinutes:
          data.durationMinutes != null
            ? data.durationMinutes
            : existing.durationMinutes,
        daysOfWeek:
          data.daysOfWeek != null ? data.daysOfWeek : existing.daysOfWeek,
        startTime: data.startTime != null ? data.startTime : existing.startTime,
        endTime: data.endTime != null ? data.endTime : existing.endTime,
        status: data.status != null ? data.status : existing.status,
        curriculumId: Object.prototype.hasOwnProperty.call(data, "curriculumId")
          ? data.curriculumId
          : existing.curriculumId,
      };

  if (isCreate || data.label != null) {
    if (!merged.label) return "label is required.";
  }
  if (isCreate || data.durationMinutes != null) {
    if (
      !Number.isFinite(merged.durationMinutes) ||
      !Number.isInteger(merged.durationMinutes) ||
      merged.durationMinutes < 1
    ) {
      return "durationMinutes must be a positive integer.";
    }
  }
  if (isCreate || data.daysOfWeek != null) {
    if (!merged.daysOfWeek.length) return "At least one dayOfWeek is required.";
    for (const d of merged.daysOfWeek) {
      if (!DAY_ENUM.includes(d)) {
        return `Invalid dayOfWeek "${d}". Use Mon–Sun.`;
      }
    }
    if (merged.daysOfWeek.length !== new Set(merged.daysOfWeek).size) {
      return "daysOfWeek must not contain duplicates.";
    }
  }
  if (
    isCreate ||
    data.startTime != null ||
    data.endTime != null ||
    data.durationMinutes != null
  ) {
    const timeErr = validateStartDurationEnd(
      merged.startTime,
      merged.endTime,
      merged.durationMinutes,
    );
    if (timeErr) return timeErr;
  }
  if (
    merged.status != null &&
    merged.status !== "" &&
    !STATUS_ENUM.includes(merged.status)
  ) {
    return `status must be one of: ${STATUS_ENUM.join(", ")}.`;
  }

  return null;
}

async function resolveSectionModel() {
  if (mongoose.models.Section) return mongoose.models.Section;
  try {
    return require("../models/Section");
  } catch {
    return null;
  }
}

async function listSections(req, res, next) {
  try {
    const { status, facultyId, curriculumId } = req.query;
    const Section = await resolveSectionModel();
    if (!Section) {
      return res
        .status(503)
        .json({ message: "Scheduling module is not available." });
    }

    const query = {};

    if (status) {
      const normalized = normalizeString(status);
      if (
        !["Open", "Closed", "Waitlisted", "Archived", "All"].includes(
          normalized,
        )
      ) {
        return res.status(400).json({
          message: "status must be Open, Closed, Waitlisted, Archived, or All.",
        });
      }
      if (normalized !== "All") {
        query.status = normalized;
      }
    }

    if (curriculumId) {
      if (!mongoose.Types.ObjectId.isValid(curriculumId)) {
        return res
          .status(400)
          .json({ message: "curriculumId must be a valid ObjectId." });
      }
      query.curriculumId = curriculumId;
    }

    if (req.query.program) {
      query.program = req.query.program;
    }

    if (req.query.yearLevel) {
      query.yearLevel = req.query.yearLevel;
    }

    if (req.query.academicYear) {
      query.academicYear = req.query.academicYear;
    }

    if (req.query.term) {
      query.term = req.query.term;
    }

    const sections = await Section.find(query)
      .populate(
        "curriculumId",
        "courseCode courseTitle curriculumYear creditUnits courseLearningOutcomes status",
      )
      .populate("schedules.roomId", "name type maximumCapacity status")
      .populate(
        "schedules.facultyId",
        "employeeId firstName lastName department status",
      )
      .populate("enrolledStudentIds", "id firstName lastName program yearLevel")
      .sort({ academicYear: -1, term: -1, updatedAt: -1 });

    // Link syllabi search
    // Using top-level Syllabus
    const sectionIds = sections.map((s) => s._id);
    const syllabi = await Syllabus.find({ sectionId: { $in: sectionIds } })
      .select("_id sectionId")
      .lean();
    const syllabusMap = new Map(
      syllabi.map((s) => [String(s.sectionId), s._id]),
    );

    return res.status(200).json(
      sections.map((row) => {
        const doc = row.toJSON();
        doc.syllabusId = syllabusMap.get(String(row._id)) || null;
        return doc;
      }),
    );
  } catch (err) {
    return next(err);
  }
}

async function getSectionById(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid section id." });
    }

    const Section = await resolveSectionModel();
    if (!Section) {
      return res
        .status(503)
        .json({ message: "Scheduling module is not available." });
    }

    const section = await Section.findById(id)
      .populate(
        "curriculumId",
        "courseCode courseTitle curriculumYear creditUnits courseLearningOutcomes status",
      )
      .populate("schedules.roomId", "name type maximumCapacity status")
      .populate(
        "schedules.facultyId",
        "employeeId firstName lastName department status",
      )
      .populate(
        "enrolledStudentIds",
        "id firstName lastName program yearLevel",
      );

    if (!section) {
      return res.status(404).json({ message: "Section not found." });
    }

    return res.status(200).json(section.toJSON());
  } catch (err) {
    return next(err);
  }
}

async function listTimeBlocks(_req, res, next) {
  try {
    const rows = await TimeBlock.find({ status: "Active" })
      .populate(
        "curriculumId",
        "courseCode courseTitle lectureHours labHours status",
      )
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
      const curErr = await validateCurriculumBounds(
        payload.curriculumId,
        payload.durationMinutes,
      );
      if (curErr) return res.status(400).json({ message: curErr });
    }

    const created = await TimeBlock.create({
      label: payload.label,
      durationMinutes: payload.durationMinutes,
      daysOfWeek: payload.daysOfWeek,
      startTime: payload.startTime,
      endTime: payload.endTime,
      status: "Active",
      curriculumId: payload.curriculumId,
    });
    const populated = await TimeBlock.findById(created._id).populate(
      "curriculumId",
      "courseCode courseTitle lectureHours labHours status",
    );
    await logActivity(req, {
      action: "Created time block",
      module: "Scheduling",
      target: populated?.label || created.label,
      status: "Completed",
    });
    return res.status(201).json(populated.toJSON());
  } catch (err) {
    if (err && err.name === "ValidationError") {
      return res
        .status(400)
        .json({ message: err.message || "Invalid time block." });
    }
    return next(err);
  }
}

async function updateTimeBlock(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid time block id." });
    }

    const existing = await TimeBlock.findById(id);
    if (!existing) {
      return res.status(404).json({ message: "Time block not found." });
    }
    if (existing.status === "Archived") {
      return res
        .status(400)
        .json({ message: "Archived time blocks cannot be updated." });
    }

    const payload = buildPayload(req.body, { partial: true });
    if (payload.status != null && payload.status === "Archived") {
      return res.status(400).json({
        message:
          "Use DELETE /api/scheduling/timeblocks/:id to archive a time block.",
      });
    }
    const err = validatePayload(payload, { isCreate: false, existing });
    if (err) return res.status(400).json({ message: err });

    const mergedDuration =
      payload.durationMinutes != null
        ? payload.durationMinutes
        : existing.durationMinutes;
    const mergedCurriculum = Object.prototype.hasOwnProperty.call(
      payload,
      "curriculumId",
    )
      ? payload.curriculumId
      : existing.curriculumId;

    if (mergedCurriculum) {
      const curErr = await validateCurriculumBounds(
        mergedCurriculum,
        mergedDuration,
      );
      if (curErr) return res.status(400).json({ message: curErr });
    }

    if (payload.label != null) existing.label = payload.label;
    if (payload.durationMinutes != null)
      existing.durationMinutes = payload.durationMinutes;
    if (payload.daysOfWeek != null) existing.daysOfWeek = payload.daysOfWeek;
    if (payload.startTime != null) existing.startTime = payload.startTime;
    if (payload.endTime != null) existing.endTime = payload.endTime;
    if (payload.status != null && payload.status !== "")
      existing.status = payload.status;
    if (Object.prototype.hasOwnProperty.call(payload, "curriculumId")) {
      existing.curriculumId = payload.curriculumId;
    }

    await existing.save();
    const populated = await TimeBlock.findById(existing._id).populate(
      "curriculumId",
      "courseCode courseTitle lectureHours labHours status",
    );
    await logActivity(req, {
      action: "Updated time block",
      module: "Scheduling",
      target: populated?.label || existing.label,
      status: "Completed",
    });
    return res.status(200).json(populated.toJSON());
  } catch (err) {
    if (err && err.name === "ValidationError") {
      return res
        .status(400)
        .json({ message: err.message || "Invalid time block." });
    }
    return next(err);
  }
}

async function archiveTimeBlock(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid time block id." });
    }

    const row = await TimeBlock.findById(id);
    if (!row) {
      return res.status(404).json({ message: "Time block not found." });
    }
    if (row.status === "Archived") {
      return res
        .status(400)
        .json({ message: "Time block is already archived." });
    }

    row.status = "Archived";
    await row.save();
    await logActivity(req, {
      action: "Archived time block",
      module: "Scheduling",
      target: row.label,
      status: "Completed",
    });
    return res
      .status(200)
      .json({ message: "Time block archived.", timeBlock: row.toJSON() });
  } catch (err) {
    return next(err);
  }
}

async function createSection(req, res, next) {
  try {
    const Section = await resolveSectionModel();
    if (!Section) {
      return res
        .status(503)
        .json({ message: "Scheduling module is not available." });
    }

    const {
      sectionIdentifier,
      program,
      yearLevel,
      term,
      academicYear,
      curriculumId,
    } = req.body;

    if (!sectionIdentifier)
      return res
        .status(400)
        .json({ message: "sectionIdentifier is required." });
    if (!program)
      return res.status(400).json({ message: "program is required." });
    if (!yearLevel)
      return res.status(400).json({ message: "yearLevel is required." });
    if (!term) return res.status(400).json({ message: "term is required." });
    if (!academicYear)
      return res.status(400).json({ message: "academicYear is required." });

    // Check for duplicates (same name within same program/year/academicYear)
    const existing = await Section.findOne({
      sectionIdentifier,
      program,
      yearLevel,
      academicYear,
    });

    if (existing) {
      return res.status(409).json({
        message: `Section ${sectionIdentifier} already exists for this program, year, and academic year.`,
      });
    }

    if (curriculumId) {
      const curriculum = await Curriculum.findById(curriculumId);
      if (!curriculum)
        return res.status(404).json({ message: "Curriculum not found." });
      if (curriculum.status !== "Active") {
        return res.status(400).json({ message: "Curriculum is not active." });
      }
    }

    const newSection = new Section({
      sectionIdentifier,
      program,
      yearLevel,
      curriculumId,
      term,
      academicYear,
      status: "Active",
      currentEnrollmentCount: 0,
      schedules: [],
    });

    await newSection.save();

    const populated = await Section.findById(newSection._id).populate(
      "curriculumId",
      "courseCode courseTitle curriculumYear creditUnits courseLearningOutcomes status",
    );

    await logActivity(req, {
      action: "Created section",
      module: "Scheduling",
      target: populated?.sectionIdentifier || newSection.sectionIdentifier,
      status: "Completed",
    });

    return res.status(201).json(populated.toJSON());
  } catch (err) {
    if (err && err.name === "ValidationError") {
      return res
        .status(400)
        .json({ message: err.message || "Invalid section data." });
    }
    if (err && err.code === 11000) {
      return res.status(409).json({
        message:
          "A section with this identifier already exists in the same scope.",
      });
    }
    return next(err);
  }
}

async function updateSection(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid section id." });
    }

    const Section = await resolveSectionModel();
    const section = await Section.findById(id);
    if (!section)
      return res.status(404).json({ message: "Section not found." });

    const {
      sectionIdentifier,
      program,
      yearLevel,
      term,
      academicYear,
      status,
    } = req.body;

    const updates = {};
    let notifyStudents = false;

    if (sectionIdentifier && sectionIdentifier !== section.sectionIdentifier) {
      updates.sectionIdentifier = sectionIdentifier;
    }

    if (program && program !== section.program) {
      updates.program = program;
      notifyStudents = true;
    }

    if (yearLevel && yearLevel !== section.yearLevel) {
      updates.yearLevel = yearLevel;
      notifyStudents = true;
    }

    if (term) updates.term = term;
    if (academicYear) updates.academicYear = academicYear;
    if (status) updates.status = status;

    // Validation for duplicates if name/program/year changed
    if (
      updates.sectionIdentifier ||
      updates.program ||
      updates.yearLevel ||
      updates.academicYear
    ) {
      const checkName = updates.sectionIdentifier || section.sectionIdentifier;
      const checkProg = updates.program || section.program;
      const checkYear = updates.yearLevel || section.yearLevel;
      const checkAY = updates.academicYear || section.academicYear;

      const existing = await Section.findOne({
        _id: { $ne: id },
        sectionIdentifier: checkName,
        program: checkProg,
        yearLevel: checkYear,
        academicYear: checkAY,
      });

      if (existing) {
        return res.status(409).json({
          message:
            "A section with this name already exists for the target program and year level.",
        });
      }
    }

    Object.assign(section, updates);
    await section.save();

    if (
      notifyStudents &&
      section.enrolledStudentIds &&
      section.enrolledStudentIds.length > 0
    ) {
      // Logic for system notifications to students (US-003)
      // Assuming a Notification model exists or we log it
      const Notification = mongoose.models.Notification;
      if (Notification) {
        const studentIds = section.enrolledStudentIds;
        await Notification.create(
          studentIds.map((sid) => ({
            userId: sid, // Assuming student _id is their userId or linked
            title: "Section Update",
            message: `Your section ${section.sectionIdentifier} has been updated to ${section.program} Year ${section.yearLevel}.`,
            type: "Info",
            status: "Unread",
          })),
        );
      }
    }

    await logActivity(req, {
      action: "Updated section details",
      module: "Scheduling",
      target: section.sectionIdentifier,
      status: "Completed",
      metadata: updates,
    });

    return res.status(200).json(section.toJSON());
  } catch (err) {
    return next(err);
  }
}

async function updateSectionResources(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid section id." });
    }

    const { schedules } = req.body;
    if (!Array.isArray(schedules)) {
      return res.status(400).json({ message: "schedules must be an array." });
    }

    const Section = await resolveSectionModel();
    if (!Section) {
      return res
        .status(503)
        .json({ message: "Scheduling module is not available." });
    }

    const section = await Section.findById(id);
    if (!section)
      return res.status(404).json({ message: "Section not found." });

    if (section.status === "Archived") {
      return res
        .status(400)
        .json({ message: "Archived sections cannot be modified." });
    }

    // US-008: Populate section before assigning faculty and rooms
    if (section.currentEnrollmentCount === 0) {
      return res.status(400).json({
        message:
          "Please populate this section with students before assigning faculty and rooms.",
      });
    }

    const oldFacultyIds = new Set(
      section.schedules.map((s) => s.facultyId.toString()),
    );

    // Validation & Conflict Check
    const activeSections = await Section.find({
      term: section.term,
      academicYear: section.academicYear,
      _id: { $ne: section._id },
      status: { $in: ["Open", "Waitlisted", "Closed"] },
    });

    for (let i = 0; i < schedules.length; i++) {
      const s = schedules[i];
      const nStart = parseTimeToMinutes(s.startTime);
      const nEnd = parseTimeToMinutes(s.endTime);

      if (nStart == null || nEnd == null) {
        return res
          .status(400)
          .json({ message: "Invalid startTime or endTime format. Use HH:mm." });
      }
      if (nStart >= nEnd) {
        return res
          .status(400)
          .json({ message: "startTime must be before endTime." });
      }

      // Check intra-schedule conflicts (within the new payload itself)
      for (let j = i + 1; j < schedules.length; j++) {
        const s2 = schedules[j];
        if (s.dayOfWeek === s2.dayOfWeek) {
          const s2Start = parseTimeToMinutes(s2.startTime);
          const s2End = parseTimeToMinutes(s2.endTime);
          if (nStart < s2End && nEnd > s2Start) {
            return res.status(409).json({
              message: "Conflict detected within the new schedules payload.",
              conflictType: "INTERNAL_SCHEDULE_CONFLICT",
              sectionIdentifier: section.sectionIdentifier,
            });
          }
        }
      }

      // Check external system state conflicts
      for (const existingSec of activeSections) {
        if (!existingSec.schedules || !Array.isArray(existingSec.schedules))
          continue;

        for (const ex of existingSec.schedules) {
          if (s.dayOfWeek !== ex.dayOfWeek) continue;

          const eStart = parseTimeToMinutes(ex.startTime);
          const eEnd = parseTimeToMinutes(ex.endTime);

          if (eStart == null || eEnd == null) continue;

          if (nStart < eEnd && nEnd > eStart) {
            if (
              s.roomId &&
              ex.roomId &&
              s.roomId.toString() === ex.roomId.toString()
            ) {
              return res.status(409).json({
                message:
                  "Conflict detected: Room is already booked for this time.",
                conflictType: "ROOM_DOUBLE_BOOKED",
                sectionIdentifier: existingSec.sectionIdentifier,
              });
            }
            if (
              s.facultyId &&
              ex.facultyId &&
              s.facultyId.toString() === ex.facultyId.toString()
            ) {
              return res.status(409).json({
                message:
                  "Conflict detected: Faculty is already booked for this time.",
                conflictType: "FACULTY_DOUBLE_BOOKED",
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

    // US-008: Notify newly assigned faculty
    const newFacultyIds = new Set(schedules.map((s) => s.facultyId.toString()));
    const addedFacultyIds = Array.from(newFacultyIds).filter(
      (fid) => !oldFacultyIds.has(fid),
    );

    if (addedFacultyIds.length > 0) {
      const Notification = mongoose.models.Notification;
      if (Notification) {
        await Notification.create(
          addedFacultyIds.map((fid) => ({
            userId: fid, // Assuming faculty _id is their userId
            title: "New Class Assignment",
            message: `You have been assigned to teach a new subject in section ${section.sectionIdentifier}.`,
            type: "Assignment",
            status: "Unread",
          })),
        );
      }
    }

    const populated = await Section.findById(id)
      .populate(
        "curriculumId",
        "courseCode courseTitle curriculumYear creditUnits courseLearningOutcomes status",
      )
      .populate("schedules.curriculumId", "courseCode courseTitle")
      .populate("schedules.roomId", "name type maximumCapacity status")
      .populate(
        "schedules.facultyId",
        "employeeId firstName lastName department status",
      );

    await logActivity(req, {
      action: "Updated section resources",
      module: "Scheduling",
      target: populated?.sectionIdentifier || section.sectionIdentifier,
      status: "Completed",
    });

    return res.status(200).json(populated.toJSON());
  } catch (err) {
    if (err && err.name === "ValidationError") {
      return res
        .status(400)
        .json({ message: err.message || "Invalid schedules data." });
    }
    return next(err);
  }
}

async function getScheduleMatrix(req, res, next) {
  try {
    const { term, academicYear } = req.query;
    if (!term) return res.status(400).json({ message: "term is required." });
    if (!academicYear)
      return res.status(400).json({ message: "academicYear is required." });

    const Section = await resolveSectionModel();
    if (!Section) {
      return res
        .status(503)
        .json({ message: "Scheduling module is not available." });
    }

    const sections = await Section.find({
      term,
      academicYear,
      status: { $in: ["Active", "Open", "Waitlisted", "Closed"] },
    })
      .populate("curriculumId", "courseCode courseTitle")
      .populate("schedules.curriculumId", "courseCode courseTitle")
      .populate("schedules.roomId", "name maximumCapacity")
      .populate("schedules.facultyId", "firstName lastName employeeId");

    const matrixEvents = [];
    sections.forEach((sec) => {
      if (sec.schedules && Array.isArray(sec.schedules)) {
        sec.schedules.forEach((sched) => {
          const room = sched.roomId;
          const faculty = sched.facultyId;
          const course = sched.curriculumId || sec.curriculumId;

          matrixEvents.push({
            sectionId: sec._id,
            sectionIdentifier: sec.sectionIdentifier,
            courseCode: course?.courseCode || "N/A",
            courseTitle: course?.courseTitle || "N/A",
            roomId: room?._id || room,
            roomName: room?.name || "Unknown Room",
            facultyId: faculty?._id || faculty,
            facultyName:
              faculty && typeof faculty === "object" && faculty.firstName
                ? `${faculty.firstName} ${faculty.lastName}`
                : faculty
                  ? "Assigned"
                  : "Unassigned",
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
    if (!term) return res.status(400).json({ message: "term is required." });
    if (!academicYear)
      return res.status(400).json({ message: "academicYear is required." });

    const Section = await resolveSectionModel();

    // Get all active rooms first to ensure we account for empty ones
    const allActiveRooms = await Room.find({ status: "Active" }).lean();

    // Aggregation pipeline for calculating total hours per room from sections
    const pipeline = [
      {
        $match: {
          term,
          academicYear,
          status: { $in: ["Open", "Waitlisted", "Closed"] },
        },
      },
      { $unwind: "$schedules" },
      {
        $group: {
          _id: "$schedules.roomId",
          totalMinutes: {
            $sum: {
              $subtract: [
                {
                  $add: [
                    {
                      $multiply: [
                        { $toInt: { $substr: ["$schedules.endTime", 0, 2] } },
                        60,
                      ],
                    },
                    { $toInt: { $substr: ["$schedules.endTime", 3, 2] } },
                  ],
                },
                {
                  $add: [
                    {
                      $multiply: [
                        { $toInt: { $substr: ["$schedules.startTime", 0, 2] } },
                        60,
                      ],
                    },
                    { $toInt: { $substr: ["$schedules.startTime", 3, 2] } },
                  ],
                },
              ],
            },
          },
          schedules: {
            $push: {
              dayOfWeek: "$schedules.dayOfWeek",
              startTime: "$schedules.startTime",
              endTime: "$schedules.endTime",
              sectionIdentifier: "$sectionIdentifier",
            },
          },
        },
      },
    ];

    const utilizationData = await Section.aggregate(pipeline);

    // Merge everything into the list of all active rooms
    const result = allActiveRooms.map((room) => {
      const stats = utilizationData.find(
        (u) => String(u._id) === String(room._id),
      );
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
  return resolveFacultyForUser(req);
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
      return res
        .status(503)
        .json({ message: "Scheduling module is not available." });
    }

    // Using top-level Syllabus
    const SyllabusModel = Syllabus;

    const baseQuery = {
      status: { $in: ["Open", "Waitlisted", "Closed"] },
    };
    if (term) {
      baseQuery.term = term;
    }

    const sectionIdSet = new Set();

    const sectionsWithFaculty = await Section.find({
      ...baseQuery,
      schedules: { $elemMatch: { facultyId: faculty._id } },
    })
      .select("_id")
      .lean();
    sectionsWithFaculty.forEach((s) => sectionIdSet.add(s._id.toString()));

    const syllabiWithSections = await SyllabusModel.find({
      facultyId: faculty._id,
      sectionId: { $ne: null },
    })
      .select("sectionId _id")
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
      _id: {
        $in: [...sectionIdSet].map((id) => new mongoose.Types.ObjectId(id)),
      },
      ...baseQuery,
    };

    const sections = await Section.find(sectionQuery)
      .populate("curriculumId", "courseCode courseTitle")
      .sort({ academicYear: -1, term: 1, sectionIdentifier: 1 })
      .lean();

    const rows = sections.map((sec) => {
      // Find the specific schedule block for this faculty to get the right course if it differs
      const mySched = sec.schedules.find(
        (s) => s.facultyId.toString() === faculty._id.toString(),
      );
      const course = mySched?.curriculumId || sec.curriculumId;

      return {
        sectionId: sec._id.toString(),
        sectionIdentifier: sec.sectionIdentifier,
        term: sec.term,
        academicYear: sec.academicYear,
        courseCode: course?.courseCode,
        courseTitle: course?.courseTitle,
        syllabusId: syllabusBySectionId.get(sec._id.toString()) || null,
        enrolledCount: Array.isArray(sec.enrolledStudentIds)
          ? sec.enrolledStudentIds.length
          : 0,
      };
    });

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
    const query = {
      status: { $in: ["Active", "Open", "Waitlisted", "Closed"] },
      schedules: { $elemMatch: { facultyId: faculty._id } },
    };
    if (term) query.term = term;

    const sections = await Section.find(query)
      .populate("curriculumId", "courseCode courseTitle")
      .populate("schedules.curriculumId", "courseCode courseTitle")
      .populate("schedules.roomId", "name");

    const SyllabusModel = Syllabus;

    const myEvents = [];
    for (const sec of sections) {
      if (!sec.schedules || !Array.isArray(sec.schedules)) continue;

      let secSyllabusId = null;
      if (SyllabusModel) {
        const syllabus = await SyllabusModel.findOne({
          sectionId: sec._id,
          facultyId: faculty._id,
        }).lean();
        if (syllabus) secSyllabusId = syllabus._id.toString();
      }

      for (const sched of sec.schedules) {
        if (
          sched.facultyId &&
          sched.facultyId.toString() === faculty._id.toString()
        ) {
          myEvents.push({
            sectionId: sec._id.toString(),
            sectionIdentifier: sec.sectionIdentifier,
            term: sec.term,
            academicYear: sec.academicYear,
            courseCode: sec.curriculumId?.courseCode,
            courseTitle: sec.curriculumId?.courseTitle,
            roomId: sched.roomId?._id,
            roomName: sched.roomId?.name || "TBA",
            dayOfWeek: sched.dayOfWeek,
            startTime: sched.startTime,
            endTime: sched.endTime,
            syllabusId: secSyllabusId,
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
  return facultyTeachesSectionScoped(facultyMongoId, sectionDoc);
}

async function assertStaffCanManageSectionRoster(req, sectionDoc) {
  return assertFacultySectionAccess(req, sectionDoc);
}

async function resolveStudentObjectIdsFromBody(ids) {
  // Using top-level Student
  const out = [];
  const seen = new Set();
  if (!Array.isArray(ids)) return out;
  for (const raw of ids) {
    const s = String(raw ?? "").trim();
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

function normalizeSessionDateInput(value) {
  const raw = String(value || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null;
  return raw;
}

async function getSectionRoster(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid section id." });
    }
    const Section = await resolveSectionModel();
    if (!Section)
      return res
        .status(503)
        .json({ message: "Scheduling module is not available." });

    const section = await Section.findById(id)
      .populate("curriculumId", "courseCode courseTitle")
      .lean();
    if (!section)
      return res.status(404).json({ message: "Section not found." });

    const gate = await assertStaffCanManageSectionRoster(req, section);
    if (!gate.ok)
      return res.status(gate.status).json({ message: gate.message });

    // Using top-level Student
    const ids = Array.isArray(section.enrolledStudentIds)
      ? section.enrolledStudentIds
      : [];
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
      return res.status(400).json({ message: "Invalid section id." });
    }
    const Section = await resolveSectionModel();
    const section = await Section.findById(id);
    if (!section)
      return res.status(404).json({ message: "Section not found." });

    if (section.status === "Archived") {
      return res
        .status(400)
        .json({ message: "Cannot modify roster for an archived section." });
    }

    const { add, remove, removalReason } = req.body;
    if (!Array.isArray(add) && !Array.isArray(remove)) {
      return res.status(400).json({
        message: "Provide add and/or remove as arrays of student ids.",
      });
    }

    const addIds = await resolveStudentObjectIdsFromBody(
      Array.isArray(add) ? add : [],
    );
    const removeIds = await resolveStudentObjectIdsFromBody(
      Array.isArray(remove) ? remove : [],
    );

    // Capacity Check for Additions
    const currentIds = new Set(
      (section.enrolledStudentIds || []).map((x) => x.toString()),
    );
    const newAddIds = addIds.filter((aid) => !currentIds.has(aid.toString()));

    if (currentIds.size - removeIds.length + newAddIds.length > 55) {
      return res.status(400).json({
        message: "Enrollment failed: Section capacity (55) would be exceeded.",
      });
    }

    // Process Removals
    for (const rid of removeIds) {
      if (currentIds.has(rid.toString())) {
        currentIds.delete(rid.toString());
        await Student.findByIdAndUpdate(
          rid,
          { sectionId: null, section: "" },
          { runValidators: true },
        );

        await logActivity(req, {
          action: "Removed student from section",
          module: "Scheduling",
          target: section.sectionIdentifier,
          status: "Completed",
          metadata: {
            studentId: rid,
            reason: removalReason || "Not specified",
          },
        });
      }
    }

    // Process Additions
    for (const aid of newAddIds) {
      // 1. Check if student was in another section and remove them from there
      const student = await Student.findById(aid);
      if (student && student.sectionId && student.sectionId.toString() !== id) {
        const prevSection = await Section.findById(student.sectionId);
        if (prevSection) {
          prevSection.enrolledStudentIds =
            prevSection.enrolledStudentIds.filter(
              (sid) => sid.toString() !== aid.toString(),
            );
          prevSection.currentEnrollmentCount =
            prevSection.enrolledStudentIds.length;
          await prevSection.save();
        }
      }

      currentIds.add(aid.toString());
      await Student.findByIdAndUpdate(
        aid,
        { sectionId: id, section: section.sectionIdentifier },
        { runValidators: true },
      );
    }

    section.enrolledStudentIds = Array.from(currentIds).map(
      (s) => new mongoose.Types.ObjectId(s),
    );
    section.currentEnrollmentCount = section.enrolledStudentIds.length;
    await section.save();

    const populated = await Section.findById(id)
      .populate("curriculumId", "courseCode courseTitle")
      .lean();

    const ids2 = populated.enrolledStudentIds || [];
    const docs = await Student.find({ _id: { $in: ids2 } }).lean();
    const byId = new Map(docs.map((d) => [d._id.toString(), d]));
    const ordered = ids2.map((oid) => byId.get(String(oid))).filter(Boolean);

    await logActivity(req, {
      action: "Updated section roster",
      module: "Scheduling",
      target: populated?.sectionIdentifier || section.sectionIdentifier,
      status: "Completed",
      metadata: {
        enrolledCount: ordered.length,
        added: newAddIds.length,
        removed: removeIds.length,
      },
    });

    return res.status(200).json({
      section: {
        ...populated,
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

async function transferStudent(req, res, next) {
  try {
    const { studentId, targetSectionId } = req.body;
    if (
      !mongoose.Types.ObjectId.isValid(studentId) ||
      !mongoose.Types.ObjectId.isValid(targetSectionId)
    ) {
      return res
        .status(400)
        .json({ message: "Invalid studentId or targetSectionId." });
    }

    const Section = await resolveSectionModel();
    const targetSection = await Section.findById(targetSectionId);
    if (!targetSection)
      return res.status(404).json({ message: "Target section not found." });

    if (targetSection.currentEnrollmentCount >= 55) {
      return res
        .status(400)
        .json({ message: "Transfer failed: Target section is full." });
    }

    const student = await Student.findById(studentId);
    if (!student)
      return res.status(404).json({ message: "Student not found." });

    const prevSectionId = student.sectionId;
    if (prevSectionId && prevSectionId.toString() === targetSectionId) {
      return res
        .status(400)
        .json({ message: "Student is already in the target section." });
    }

    // 1. Remove from previous section
    if (prevSectionId) {
      const prevSection = await Section.findById(prevSectionId);
      if (prevSection) {
        prevSection.enrolledStudentIds = prevSection.enrolledStudentIds.filter(
          (id) => id.toString() !== studentId,
        );
        prevSection.currentEnrollmentCount =
          prevSection.enrolledStudentIds.length;
        await prevSection.save();
      }
    }

    // 2. Add to target section
    targetSection.enrolledStudentIds.push(
      new mongoose.Types.ObjectId(studentId),
    );
    targetSection.currentEnrollmentCount =
      targetSection.enrolledStudentIds.length;
    await targetSection.save();

    // 3. Update student
    student.sectionId = targetSectionId;
    student.section = targetSection.sectionIdentifier;
    await student.save();

    await logActivity(req, {
      action: "Transferred student between sections",
      module: "Scheduling",
      target: student.id,
      status: "Completed",
      metadata: { from: prevSectionId, to: targetSectionId },
    });

    return res
      .status(200)
      .json({ message: "Student transferred successfully.", student });
  } catch (err) {
    return next(err);
  }
}

async function getSectionAttendance(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid section id." });
    }
    const sessionDate = normalizeSessionDateInput(req.query?.sessionDate);
    if (!sessionDate) {
      return res
        .status(400)
        .json({ message: "sessionDate is required in YYYY-MM-DD format." });
    }

    const Section = await resolveSectionModel();
    if (!Section)
      return res
        .status(503)
        .json({ message: "Scheduling module is not available." });
    const section = await Section.findById(id).lean();
    if (!section)
      return res.status(404).json({ message: "Section not found." });

    const gate = await assertStaffCanManageSectionRoster(req, section);
    if (!gate.ok)
      return res.status(gate.status).json({ message: gate.message });

    // Using top-level ClassAttendance
    const row = await ClassAttendance.findOne({
      sectionId: section._id,
      sessionDate,
    }).lean();
    const records = Array.isArray(row?.records)
      ? row.records.map((r) => ({
          studentId: String(r.studentId),
          status: r.status,
        }))
      : [];

    return res.status(200).json({
      sectionId: String(section._id),
      sessionDate,
      records,
      updatedAt: row?.updatedAt || null,
    });
  } catch (err) {
    return next(err);
  }
}

async function upsertSectionAttendance(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid section id." });
    }

    const sessionDate = normalizeSessionDateInput(req.body?.sessionDate);
    if (!sessionDate) {
      return res
        .status(400)
        .json({ message: "sessionDate is required in YYYY-MM-DD format." });
    }
    const records = Array.isArray(req.body?.records) ? req.body.records : null;
    if (!records) {
      return res.status(400).json({ message: "records must be an array." });
    }

    const Section = await resolveSectionModel();
    if (!Section)
      return res
        .status(503)
        .json({ message: "Scheduling module is not available." });
    const section = await Section.findById(id);
    if (!section)
      return res.status(404).json({ message: "Section not found." });
    if (section.status === "Archived") {
      return res
        .status(400)
        .json({ message: "Cannot modify attendance for an archived section." });
    }

    const gate = await assertStaffCanManageSectionRoster(req, section);
    if (!gate.ok)
      return res.status(gate.status).json({ message: gate.message });

    const enrolledSet = new Set(
      (section.enrolledStudentIds || []).map((sid) => String(sid)),
    );
    const nextRecords = [];
    const seen = new Set();
    for (const row of records) {
      const sid = String(row?.studentId || "").trim();
      const status = String(row?.status || "").trim();
      if (!sid || !mongoose.Types.ObjectId.isValid(sid)) {
        return res.status(400).json({
          message: "Each record.studentId must be a valid student ObjectId.",
        });
      }
      if (!["Present", "Late", "Absent"].includes(status)) {
        return res
          .status(400)
          .json({ message: "record.status must be Present, Late, or Absent." });
      }
      if (!enrolledSet.has(sid)) {
        return res.status(400).json({
          message:
            "Attendance records must only include currently enrolled students.",
        });
      }
      if (seen.has(sid)) continue;
      seen.add(sid);
      nextRecords.push({
        studentId: new mongoose.Types.ObjectId(sid),
        status,
      });
    }

    // Using top-level ClassAttendance
    const saved = await ClassAttendance.findOneAndUpdate(
      { sectionId: section._id, sessionDate },
      {
        $set: {
          records: nextRecords,
          updatedByUserId: req.user?.id
            ? new mongoose.Types.ObjectId(req.user.id)
            : null,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).lean();

    await logActivity(req, {
      action: "Updated class attendance",
      module: "Scheduling",
      target: section.sectionIdentifier,
      status: "Completed",
      metadata: { sessionDate, records: nextRecords.length },
    });

    return res.status(200).json({
      sectionId: String(section._id),
      sessionDate,
      records: (saved.records || []).map((r) => ({
        studentId: String(r.studentId),
        status: r.status,
      })),
      updatedAt: saved.updatedAt || null,
    });
  } catch (err) {
    if (err && err.code === 11000) {
      return res.status(409).json({
        message: "Attendance record already exists for that section and date.",
      });
    }
    return next(err);
  }
}

async function batchLevelUp(req, res, next) {
  try {
    const { sectionIds, nextAcademicYear } = req.body;
    if (!Array.isArray(sectionIds) || sectionIds.length === 0) {
      return res.status(400).json({ message: "sectionIds array is required." });
    }
    if (!nextAcademicYear) {
      return res.status(400).json({ message: "nextAcademicYear is required." });
    }

    const Section = await resolveSectionModel();
    const Student = require("../models/Student");

    const yearLevels = ["1st Year", "2nd Year", "3rd Year", "4th Year"];
    const results = { success: [], failure: [] };

    for (const id of sectionIds) {
      try {
        const section = await Section.findById(id);
        if (!section) {
          results.failure.push({ id, reason: "Not found" });
          continue;
        }

        const currentIndex = yearLevels.indexOf(section.yearLevel);
        if (currentIndex === -1) {
          results.failure.push({
            id,
            identifier: section.sectionIdentifier,
            reason: "Unknown current year level",
          });
          continue;
        }

        if (currentIndex === yearLevels.length - 1) {
          results.failure.push({
            id,
            identifier: section.sectionIdentifier,
            reason:
              "Cannot level up final year section (use Graduation instead)",
          });
          continue;
        }

        const nextYearLevel = yearLevels[currentIndex + 1];

        // Update section name: e.g. BSIT-1A -> BSIT-2A
        let nextIdentifier = section.sectionIdentifier;
        const yearDigitMatch = section.sectionIdentifier.match(/-(\d)/);
        if (yearDigitMatch) {
          const currentDigit = parseInt(yearDigitMatch[1]);
          nextIdentifier = section.sectionIdentifier.replace(
            `-${currentDigit}`,
            `-${currentDigit + 1}`,
          );
        }

        section.yearLevel = nextYearLevel;
        section.sectionIdentifier = nextIdentifier;
        section.academicYear = nextAcademicYear;
        section.schedules = []; // US-010: Previous schedule assignments are cleared
        section.term = "1st Term"; // Reset to 1st term of new year

        await section.save();

        // Update student year levels
        if (
          section.enrolledStudentIds &&
          section.enrolledStudentIds.length > 0
        ) {
          await Student.updateMany(
            { _id: { $in: section.enrolledStudentIds } },
            { $set: { yearLevel: nextYearLevel } },
          );
        }

        results.success.push({
          id,
          identifier: section.sectionIdentifier,
          from: section.yearLevel,
          to: nextYearLevel,
        });
      } catch (err) {
        results.failure.push({ id, reason: err.message });
      }
    }

    await logActivity(req, {
      action: "Batch Level-Up Sections",
      module: "Scheduling",
      target: `Bulk: ${sectionIds.length} sections`,
      status: "Completed",
      metadata: results,
    });

    return res.status(200).json(results);
  } catch (err) {
    return next(err);
  }
}

async function graduateSections(req, res, next) {
  try {
    const { sectionIds } = req.body;
    if (!Array.isArray(sectionIds) || sectionIds.length === 0) {
      return res.status(400).json({ message: "sectionIds array is required." });
    }

    const Section = await resolveSectionModel();
    const Student = require("../models/Student");
    const results = { success: [], failure: [] };
    const graduationDate = new Date().toISOString();

    for (const id of sectionIds) {
      try {
        const section = await Section.findById(id);
        if (!section) {
          results.failure.push({ id, reason: "Not found" });
          continue;
        }

        section.status = "Graduated";
        await section.save();

        if (
          section.enrolledStudentIds &&
          section.enrolledStudentIds.length > 0
        ) {
          await Student.updateMany(
            { _id: { $in: section.enrolledStudentIds } },
            { $set: { status: "Graduated" } },
          );
        }

        results.success.push({ id, identifier: section.sectionIdentifier });
      } catch (err) {
        results.failure.push({ id, reason: err.message });
      }
    }

    await logActivity(req, {
      action: "Batch Graduate Sections",
      module: "Scheduling",
      target: `Bulk: ${sectionIds.length} sections`,
      status: "Completed",
      metadata: { graduationDate, results },
    });

    return res.status(200).json(results);
  } catch (err) {
    return next(err);
  }
}

async function getStudentSchedule(req, res, next) {
  try {
    const User = require("../models/User");
    const user = await User.findById(req.user.id);
    if (!user || user.role !== "student" || !user.studentId) {
      return res
        .status(403)
        .json({ message: "Access denied or missing student ID." });
    }

    const Student = require("../models/Student");
    const student = await Student.findOne({ id: user.studentId });
    if (!student || !student.sectionId) {
      return res
        .status(404)
        .json({ message: "Student record or section assignment not found." });
    }

    const Section = await resolveSectionModel();
    const section = await Section.findById(student.sectionId)
      .populate("curriculumId", "courseCode courseTitle")
      .populate("schedules.curriculumId", "courseCode courseTitle")
      .populate("schedules.roomId", "name type")
      .populate("schedules.facultyId", "firstName lastName");

    if (!section) {
      return res.status(404).json({ message: "Assigned section not found." });
    }

    return res.status(200).json({
      sectionId: section._id,
      sectionIdentifier: section.sectionIdentifier,
      program: section.program,
      yearLevel: section.yearLevel,
      term: section.term,
      academicYear: section.academicYear,
      schedules: section.schedules,
    });
  } catch (err) {
    return next(err);
  }
}

async function getSchedulingAnalytics(req, res, next) {
  try {
    const Section = await resolveSectionModel();
    if (!Section) {
      return res
        .status(503)
        .json({ message: "Scheduling module is not available." });
    }

    const sections = await Section.find({ status: { $ne: "Archived" } }).lean();

    const stats = {
      totalSections: sections.length,
      nearingCapacity: sections.filter((s) => s.currentEnrollmentCount >= 50)
        .length,
      emptySections: sections.filter((s) => s.currentEnrollmentCount === 0)
        .length,
      totalStudents: sections.reduce(
        (acc, s) => acc + (s.currentEnrollmentCount || 0),
        0,
      ),
      avgUtilization: 0,
      programDistribution: {},
      facultyCoverage: { assigned: 0, missing: 0 },
      yearLevelDistribution: {},
    };

    if (stats.totalSections > 0) {
      stats.avgUtilization =
        (stats.totalStudents / (stats.totalSections * 55)) * 100;
    }

    sections.forEach((s) => {
      // Program dist
      stats.programDistribution[s.program] =
        (stats.programDistribution[s.program] || 0) + 1;

      // Year level dist
      stats.yearLevelDistribution[s.yearLevel] =
        (stats.yearLevelDistribution[s.yearLevel] || 0) + 1;

      // Faculty coverage
      if (s.schedules && s.schedules.length > 0) {
        s.schedules.forEach((sched) => {
          if (sched.facultyId) stats.facultyCoverage.assigned++;
          else stats.facultyCoverage.missing++;
        });
      }
    });

    // identified sections
    const alerts = {
      nearingCapacity: sections
        .filter((s) => s.currentEnrollmentCount >= 50)
        .map((s) => ({
          id: s._id,
          identifier: s.sectionIdentifier,
          count: s.currentEnrollmentCount,
        })),
      empty: sections
        .filter((s) => s.currentEnrollmentCount === 0)
        .map((s) => ({ id: s._id, identifier: s.sectionIdentifier })),
    };

    return res.status(200).json({ stats, alerts });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  listSections,
  createSection,
  updateSection,
  updateSectionResources,
  getSectionById,
  getScheduleMatrix,
  getRoomUtilization,
  getSchedulingAnalytics,
  getMyClasses,
  getMySchedule,
  getStudentSchedule,
  getSectionRoster,
  patchSectionRoster,
  transferStudent,
  batchLevelUp,
  graduateSections,
  getSectionAttendance,
  upsertSectionAttendance,
  listTimeBlocks,
  createTimeBlock,
  updateTimeBlock,
  archiveTimeBlock,
};
