const mongoose = require('mongoose');

function normalizeString(value) {
  return String(value ?? '').trim();
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
      if (!['Active', 'Inactive', 'All'].includes(normalized)) {
        return res.status(400).json({ message: 'status must be Active, Inactive, or All.' });
      }
      if (normalized !== 'All') {
        query.status = normalized;
      }
    }

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

    const sections = await Section.find(query)
      .populate('curriculumId', 'courseCode courseTitle curriculumYear creditUnits courseLearningOutcomes status')
      .populate('facultyId', 'employeeId firstName lastName status')
      .sort({ academicYear: -1, term: -1, updatedAt: -1 });

    return res.status(200).json(sections.map((row) => row.toJSON()));
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  listSections,
};
