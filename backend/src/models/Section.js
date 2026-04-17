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
    curriculumId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Curriculum',
      index: true,
    },
    facultyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Faculty',
      index: true,
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive'],
      default: 'Active',
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

sectionSchema.index({ facultyId: 1, curriculumId: 1, status: 1 });

module.exports = mongoose.models.Section || mongoose.model('Section', sectionSchema);
