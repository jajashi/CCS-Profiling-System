const mongoose = require('mongoose');

const curriculumSchema = new mongoose.Schema(
  {
    courseCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    courseTitle: {
      type: String,
      required: true,
      trim: true,
    },
    curriculumYear: {
      type: String,
      default: '',
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    program: {
      type: String,
      required: true,
      enum: ['IT', 'CS', 'General'],
    },
    creditUnits: {
      type: Number,
      required: true,
      min: 1,
      max: 6,
    },
    lectureHours: {
      type: Number,
      default: 0,
      min: 0,
    },
    labHours: {
      type: Number,
      default: 0,
      min: 0,
    },
    prerequisites: {
      type: [String],
      default: [],
    },
    courseLearningOutcomes: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ['Active', 'Archived'],
      default: 'Active',
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model('Curriculum', curriculumSchema);