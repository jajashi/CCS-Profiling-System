const mongoose = require('mongoose');
const Specialization = require('../models/Specialization');
const Faculty = require('../models/Faculty');

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const DESCRIPTION_MAX = 500;

function normalizeDescription(body) {
  const raw = body?.description;
  const value = raw === undefined || raw === null ? '' : String(raw).trim();
  if (value.length > DESCRIPTION_MAX) {
    return { error: `description must be at most ${DESCRIPTION_MAX} characters.` };
  }
  return { value };
}

async function findNameConflictCaseInsensitive(trimmedName, excludeId) {
  const filter = {
    name: new RegExp(`^${escapeRegex(trimmedName)}$`, 'i'),
  };
  if (excludeId && mongoose.Types.ObjectId.isValid(excludeId)) {
    filter._id = { $ne: new mongoose.Types.ObjectId(excludeId) };
  }
  return Specialization.findOne(filter).lean();
}

async function getSpecializations(_req, res, next) {
  try {
    const facultyCollection = Faculty.collection.name;
    const rows = await Specialization.aggregate([
      { $sort: { name: 1 } },
      {
        $lookup: {
          from: facultyCollection,
          localField: '_id',
          foreignField: 'specializations',
          as: '_assignedFaculty',
        },
      },
      {
        $addFields: {
          assignedCount: { $size: { $ifNull: ['$_assignedFaculty', []] } },
        },
      },
      { $project: { _assignedFaculty: 0, __v: 0 } },
    ]);

    return res.status(200).json(
      rows.map((row) => ({
        _id: String(row._id),
        name: row.name,
        description: row.description != null ? row.description : '',
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        assignedCount: row.assignedCount ?? 0,
      })),
    );
  } catch (err) {
    return next(err);
  }
}

async function getSpecializationById(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid specialization identifier.' });
    }

    const specialization = await Specialization.findById(id);
    if (!specialization) {
      return res.status(404).json({ message: 'Specialization not found.' });
    }

    const assignedCount = await Faculty.countDocuments({ specializations: id });
    const json = specialization.toJSON();
    return res.status(200).json({ ...json, assignedCount });
  } catch (err) {
    return next(err);
  }
}

async function createSpecialization(req, res, next) {
  try {
    const name = String(req.body?.name || '').trim();
    if (!name) {
      return res.status(400).json({ message: 'name is required.' });
    }

    const conflict = await findNameConflictCaseInsensitive(name);
    if (conflict) {
      return res.status(400).json({ message: 'Specialization name already exists.' });
    }

    const desc = normalizeDescription(req.body);
    if (desc.error) {
      return res.status(400).json({ message: desc.error });
    }

    const created = await Specialization.create({ name, description: desc.value });
    return res.status(201).json({ ...created.toJSON(), assignedCount: 0 });
  } catch (err) {
    if (err && err.code === 11000) {
      return res.status(400).json({ message: 'Specialization name already exists.' });
    }
    if (err && err.name === 'ValidationError') {
      return res.status(400).json({ message: 'Please check specialization fields and try again.' });
    }
    return next(err);
  }
}

async function updateSpecialization(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid specialization identifier.' });
    }

    const name = String(req.body?.name || '').trim();
    if (!name) {
      return res.status(400).json({ message: 'name is required.' });
    }

    const conflict = await findNameConflictCaseInsensitive(name, id);
    if (conflict) {
      return res.status(400).json({ message: 'Specialization name already exists.' });
    }

    const desc = normalizeDescription(req.body);
    if (desc.error) {
      return res.status(400).json({ message: desc.error });
    }

    const updated = await Specialization.findByIdAndUpdate(
      id,
      { name, description: desc.value },
      { new: true, runValidators: true },
    );
    if (!updated) {
      return res.status(404).json({ message: 'Specialization not found.' });
    }

    const assignedCount = await Faculty.countDocuments({ specializations: id });
    return res.status(200).json({ ...updated.toJSON(), assignedCount });
  } catch (err) {
    if (err && err.code === 11000) {
      return res.status(400).json({ message: 'Specialization name already exists.' });
    }
    if (err && err.name === 'ValidationError') {
      return res.status(400).json({ message: 'Please check specialization fields and try again.' });
    }
    return next(err);
  }
}

async function deleteSpecialization(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid specialization identifier.' });
    }

    const assigned = await Faculty.countDocuments({ specializations: id });
    if (assigned > 0) {
      const noun = assigned === 1 ? 'faculty member' : 'faculty members';
      return res.status(400).json({
        message: `Cannot delete specialization assigned to ${assigned} ${noun}. Reassign first.`,
      });
    }

    const deleted = await Specialization.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: 'Specialization not found.' });
    }

    return res.status(200).json({ message: 'Specialization deleted successfully.' });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  getSpecializations,
  getSpecializationById,
  createSpecialization,
  updateSpecialization,
  deleteSpecialization,
};
