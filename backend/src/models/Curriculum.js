const mongoose = require('mongoose');

const COURSE_CODE_REGEX = /^[A-Z]{2,4}\d{3}$/;
const PROGRAM_ENUM = ['IT', 'CS', 'General'];
const STATUS_ENUM = ['Active', 'Archived'];

const curriculumSchema = new mongoose.Schema(
  {
    courseCode: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
      uppercase: true,
      match: COURSE_CODE_REGEX,
    },
    courseTitle: {
      type: String,
      required: true,
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
      enum: PROGRAM_ENUM,
      index: true,
    },
    creditUnits: {
      type: Number,
      required: true,
      min: 1,
      max: 6,
    },
    lectureHours: {
      type: Number,
      required: true,
      min: 0,
    },
    labHours: {
      type: Number,
      required: true,
      min: 0,
    },
    prerequisites: {
      type: [String],
      default: [],
      validate: {
        validator(values) {
          return Array.isArray(values) && values.every((value) => COURSE_CODE_REGEX.test(String(value).trim()));
        },
        message: 'Each prerequisite must be a valid courseCode.',
      },
    },
    courseLearningOutcomes: {
      type: [String],
      required: true,
      validate: {
        validator(values) {
          if (!Array.isArray(values) || values.length === 0) return false;
          return values.some((value) => String(value || '').trim().length > 0);
        },
        message: 'At least one course learning outcome is required.',
      },
    },
    status: {
      type: String,
      enum: STATUS_ENUM,
      default: 'Active',
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        if (ret._id && typeof ret._id.toString === 'function') {
          ret._id = ret._id.toString();
        }
        delete ret.__v;
        return ret;
      },
    },
  },
);

module.exports = {
  Curriculum: mongoose.model('Curriculum', curriculumSchema),
  COURSE_CODE_REGEX,
  PROGRAM_ENUM,
  STATUS_ENUM,
};
