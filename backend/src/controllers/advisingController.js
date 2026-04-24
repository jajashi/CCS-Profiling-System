const mongoose = require('mongoose');
const AdvisingNote = require('../models/AdvisingNote');
const { assertFacultySectionAccess } = require('../services/facultyPermissionsService');
const { logAudit } = require('../services/auditLogService');

async function resolveSection(id) {
  const Section = mongoose.models.Section || require('../models/Section');
  return Section.findById(id);
}

async function listAdvisingNotes(req, res, next) {
  try {
    const { sectionId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(sectionId)) {
      return res.status(400).json({ message: 'Invalid section id.' });
    }
    const section = await resolveSection(sectionId);
    if (!section) return res.status(404).json({ message: 'Section not found.' });
    const gate = await assertFacultySectionAccess(req, section);
    if (!gate.ok) return res.status(gate.status).json({ message: gate.message });

    const rows = await AdvisingNote.find({ sectionId }).sort({ updatedAt: -1 }).lean();
    return res.status(200).json(rows);
  } catch (err) {
    return next(err);
  }
}

async function createAdvisingNote(req, res, next) {
  try {
    const { sectionId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(sectionId)) {
      return res.status(400).json({ message: 'Invalid section id.' });
    }
    const section = await resolveSection(sectionId);
    if (!section) return res.status(404).json({ message: 'Section not found.' });
    const gate = await assertFacultySectionAccess(req, section);
    if (!gate.ok) return res.status(gate.status).json({ message: gate.message });

    const studentId = String(req.body?.studentId || '').trim();
    const note = String(req.body?.note || '').trim();
    const flags = Array.isArray(req.body?.flags) ? req.body.flags.map((x) => String(x).trim()).filter(Boolean) : [];
    const referralStatus = String(req.body?.referralStatus || 'none');
    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({ message: 'studentId is required and must be valid.' });
    }
    if (!note) return res.status(400).json({ message: 'note is required.' });

    const created = await AdvisingNote.create({
      sectionId,
      studentId,
      note,
      flags,
      referralStatus,
      createdByUserId: req.user.id,
      updatedByUserId: req.user.id,
    });

    await logAudit(req, {
      action: 'Created advising note',
      module: 'Advising',
      target: section.sectionIdentifier,
      status: 'Completed',
      metadata: { studentId },
    });

    return res.status(201).json(created.toObject());
  } catch (err) {
    return next(err);
  }
}

module.exports = { listAdvisingNotes, createAdvisingNote };
