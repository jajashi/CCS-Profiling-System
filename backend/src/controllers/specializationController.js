const mongoose = require('mongoose');
const Specialization = require('../models/Specialization');

async function getSpecializations(_req, res, next) {
  try {
    const specializations = await Specialization.find().sort({ name: 1 });
    return res.status(200).json(specializations.map((doc) => doc.toJSON()));
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

    return res.status(200).json(specialization.toJSON());
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

    const created = await Specialization.create({ name });
    return res.status(201).json(created.toJSON());
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

    const updated = await Specialization.findByIdAndUpdate(
      id,
      { name },
      { new: true, runValidators: true },
    );
    if (!updated) {
      return res.status(404).json({ message: 'Specialization not found.' });
    }

    return res.status(200).json(updated.toJSON());
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
