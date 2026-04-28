const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
  curriculumId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Curriculum',
    required: true,
  },
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true,
  },
  facultyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Faculty',
    required: true,
  },
  dayOfWeek: {
    type: String,
    required: true,
  },
  startTime: {
    type: String,
    required: true,
  },
  endTime: {
    type: String,
    required: true,
  },
});

const sectionSchema = new mongoose.Schema(
  {
    sectionIdentifier: {
      type: String,
      required: true,
      trim: true,
    },
    program: {
      type: String,
      required: true,
      enum: ['IT', 'CS', 'General'],
    },
    yearLevel: {
      type: String,
      required: true,
      trim: true,
    },
    curriculumId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Curriculum',
      required: false, // Made optional for Block Sections
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
    capacity: {
      type: Number,
      default: 55,
      immutable: true, // Hard limit of 55
    },
    status: {
      type: String,
      enum: ['Active', 'Archived', 'Open', 'Closed', 'Waitlisted'],
      default: 'Active',
      index: true,
    },
    currentEnrollmentCount: {
      type: Number,
      default: 0,
    },
    /** Students officially enrolled in this cohort group. */
    enrolledStudentIds: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],
      default: [],
    },
    schedules: {
      type: [scheduleSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

// Uniqueness: Section name must be unique within same program, yearLevel, academicYear
sectionSchema.index(
  { sectionIdentifier: 1, program: 1, yearLevel: 1, academicYear: 1 },
  { unique: true }
);

sectionSchema.index({ curriculumId: 1, term: 1, academicYear: 1 });

module.exports = mongoose.models.Section || mongoose.model('Section', sectionSchema);
