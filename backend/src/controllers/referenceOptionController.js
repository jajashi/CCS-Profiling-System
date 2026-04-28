const ReferenceOption = require('../models/ReferenceOption');

async function getOptions(req, res) {
  try {
    const { category } = req.query;
    const filter = { isActive: true };
    if (category) filter.category = category;

    const options = await ReferenceOption.find(filter).sort({ label: 1 });
    return res.status(200).json(options);
  } catch (err) {
    return res.status(500).json({ message: 'Internal server error' });
  }
}

async function getAllOptionsAdmin(req, res) {
  try {
    const options = await ReferenceOption.find({}).sort({ category: 1, label: 1 });
    return res.status(200).json(options);
  } catch (err) {
    return res.status(500).json({ message: 'Internal server error' });
  }
}

async function createOption(req, res) {
  try {
    const { category, value, label } = req.body;
    if (!category || !value || !label) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    const existing = await ReferenceOption.findOne({ category, value });
    if (existing) {
      return res.status(400).json({ message: 'Option already exists in this category.' });
    }

    const option = await ReferenceOption.create({ category, value, label });
    return res.status(201).json(option);
  } catch (err) {
    return res.status(500).json({ message: 'Internal server error' });
  }
}

async function updateOption(req, res) {
  try {
    const { id } = req.params;
    const { label, isActive } = req.body;

    const option = await ReferenceOption.findByIdAndUpdate(
      id,
      { label, isActive },
      { new: true }
    );

    if (!option) return res.status(404).json({ message: 'Option not found.' });
    return res.status(200).json(option);
  } catch (err) {
    return res.status(500).json({ message: 'Internal server error' });
  }
}

async function deleteOption(req, res) {
  try {
    const { id } = req.params;
    await ReferenceOption.findByIdAndDelete(id);
    return res.status(200).json({ message: 'Option deleted.' });
  } catch (err) {
    return res.status(500).json({ message: 'Internal server error' });
  }
}

module.exports = {
  getOptions,
  getAllOptionsAdmin,
  createOption,
  updateOption,
  deleteOption,
};
