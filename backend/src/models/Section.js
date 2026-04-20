const mongoose = require('mongoose');

const sectionSchema = new mongoose.Schema(
  {
    sectionIdentifier: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    curriculumId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Curriculum',
      required: true,
      index: true,
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
    status: {
      type: String,
      enum: ['Open', 'Closed', 'Waitlisted', 'Archived'],
      default: 'Open',
      index: true,
    },
    currentEnrollmentCount: {
      type: Number,
      default: 0,
    },
    schedules: {
      type: [new mongoose.Schema({}, { strict: false })],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

sectionSchema.index({ curriculumId: 1, term: 1, academicYear: 1 });

module.exports = mongoose.models.Section || mongoose.model('Section', sectionSchema);
