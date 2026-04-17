const mongoose = require('mongoose');

const SYLLABUS_STATUS_ENUM = ['Draft', 'Active', 'Archived'];
const LESSON_STATUS_ENUM = ['Pending', 'Delivered'];

const weeklyLessonSchema = new mongoose.Schema(
  {
    weekNumber: {
      type: Number,
      required: true,
      min: 1,
      max: 18,
    },
    topic: {
      type: String,
      required: true,
      trim: true,
    },
    objectives: {
      type: [String],
      default: [],
    },
    materials: {
      type: [String],
      default: [],
    },
    assessments: {
      type: String,
      default: '',
      trim: true,
    },
    timeAllocation: {
      lectureMinutes: {
        type: Number,
        default: 0,
        min: 0,
      },
      labMinutes: {
        type: Number,
        default: 0,
        min: 0,
      },
    },
    status: {
      type: String,
      enum: LESSON_STATUS_ENUM,
      default: 'Pending',
    },
    deliveredAt: {
      type: Date,
      default: null,
    },
    deliveredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Faculty',
      default: null,
    },
  },
  { _id: true },
);

const syllabusSchema = new mongoose.Schema(
  {
    curriculumId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Curriculum',
      required: true,
      index: true,
    },
    facultyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Faculty',
      required: true,
      index: true,
    },
    sectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Section',
      default: null,
      index: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    gradingSystem: {
      type: String,
      default: '',
      trim: true,
    },
    coursePolicies: {
      type: String,
      default: '',
      trim: true,
    },
    status: {
      type: String,
      enum: SYLLABUS_STATUS_ENUM,
      default: 'Draft',
    },
    weeklyLessons: {
      type: [weeklyLessonSchema],
      default: [],
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
  Syllabus: mongoose.model('Syllabus', syllabusSchema),
  SYLLABUS_STATUS_ENUM,
  LESSON_STATUS_ENUM,
};
