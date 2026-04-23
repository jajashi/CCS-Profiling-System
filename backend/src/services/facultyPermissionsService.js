const mongoose = require('mongoose');

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function resolveFacultyForUser(req) {
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

async function facultyTeachesSection(facultyMongoId, sectionDoc) {
  const fid = String(facultyMongoId);
  const hasSchedule = Array.isArray(sectionDoc.schedules)
    && sectionDoc.schedules.some((s) => s.facultyId && String(s.facultyId) === fid);
  if (hasSchedule) return true;

  const { Syllabus: SyllabusModel } = require('../models/Syllabus');
  const syll = await SyllabusModel.findOne({ sectionId: sectionDoc._id, facultyId: facultyMongoId })
    .select('_id')
    .lean();
  return Boolean(syll);
}

async function assertFacultySectionAccess(req, sectionDoc) {
  if (req.user?.role === 'admin') return { ok: true };
  if (req.user?.role !== 'faculty') {
    return { ok: false, status: 403, message: 'Access denied.' };
  }
  const resolved = await resolveFacultyForUser(req);
  if (!resolved.ok) return { ok: false, status: resolved.status, message: resolved.message };
  const teaches = await facultyTeachesSection(resolved.faculty._id, sectionDoc);
  if (!teaches) {
    return { ok: false, status: 403, message: 'You are not assigned to this section.' };
  }
  return { ok: true, faculty: resolved.faculty };
}

module.exports = {
  resolveFacultyForUser,
  facultyTeachesSection,
  assertFacultySectionAccess,
};
