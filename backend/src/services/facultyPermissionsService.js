const mongoose = require('mongoose');

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function resolveFacultyForUser(req) {
  const User = mongoose.model('User');
  const Faculty = mongoose.model('Faculty');

  const user = await User.findById(req.user.id);
  if (!user || user.role !== 'faculty') {
    console.log('[resolveFacultyForUser] Not a faculty user:', { userId: req.user.id, role: user?.role });
    return { ok: false, status: 403, message: 'Access denied: Must be authenticated as a faculty member.' };
  }

  const fromJwt = req.user.employeeId != null ? String(req.user.employeeId).trim() : '';
  const fromDb = user.employeeId != null ? String(user.employeeId).trim() : '';
  const fromUsername = user.username != null ? String(user.username).trim() : '';
  
  console.log('[resolveFacultyForUser] Looking up faculty:', { fromJwt, fromDb, fromUsername, userId: req.user.id });
  
  // Try to find faculty by employeeId first
  const employeeIdLookup = fromJwt || fromDb;
  if (employeeIdLookup) {
    const facultyByEmployeeId = await Faculty.findOne({
      employeeId: new RegExp(`^${escapeRegex(employeeIdLookup)}$`, 'i'),
    });
    console.log('[resolveFacultyForUser] Lookup by employeeId:', { employeeIdLookup, found: !!facultyByEmployeeId });
    if (facultyByEmployeeId) {
      return { ok: true, faculty: facultyByEmployeeId };
    }
  }
  
  // Fallback: try to find faculty by username (some faculty may not have employeeId linked)
  if (fromUsername) {
    // Check if username matches employeeId pattern (e.g., FAC-2026-001)
    const facultyByUsername = await Faculty.findOne({
      employeeId: new RegExp(`^${escapeRegex(fromUsername)}$`, 'i'),
    });
    console.log('[resolveFacultyForUser] Lookup by username (employeeId):', { fromUsername, found: !!facultyByUsername });
    if (facultyByUsername) {
      return { ok: true, faculty: facultyByUsername };
    }
    
    // Also try to find by institutional email containing username
    const facultyByEmail = await Faculty.findOne({
      institutionalEmail: new RegExp(`${escapeRegex(fromUsername)}`, 'i'),
    });
    console.log('[resolveFacultyForUser] Lookup by email:', { fromUsername, found: !!facultyByEmail });
    if (facultyByEmail) {
      return { ok: true, faculty: facultyByEmail };
    }
  }

  console.log('[resolveFacultyForUser] Faculty not found for user:', { userId: req.user.id, fromJwt, fromDb, fromUsername });
  return { ok: false, status: 404, message: 'Faculty profile not found for this user. Please ensure your account is linked to a faculty record.' };
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
