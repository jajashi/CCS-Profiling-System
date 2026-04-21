const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
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
    /** Students officially enrolled in this course section (scheduling), distinct from cohort `Student.section`. */
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

sectionSchema.index({ curriculumId: 1, term: 1, academicYear: 1 });

module.exports = mongoose.models.Section || mongoose.model('Section', sectionSchema);
