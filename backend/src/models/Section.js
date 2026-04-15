const mongoose = require('mongoose');

const sectionSchema = new mongoose.Schema(
  {
    sectionIdentifier: {
      type: String,
      required: true,
      trim: true,
    },
    term: {
      type: String,
      required: true,
      trim: true,
    },
    academicYear: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.models.Section || mongoose.model('Section', sectionSchema);
