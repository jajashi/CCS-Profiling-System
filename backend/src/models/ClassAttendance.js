const mongoose = require('mongoose');

const ATTENDANCE_STATUS = ['Present', 'Late', 'Absent'];

const attendanceRecordSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    status: {
      type: String,
      enum: ATTENDANCE_STATUS,
      required: true,
    },
  },
  { _id: false },
);

const classAttendanceSchema = new mongoose.Schema(
  {
    sectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Section',
      required: true,
      index: true,
    },
    sessionDate: {
      type: String,
      required: true,
      trim: true,
    },
    records: {
      type: [attendanceRecordSchema],
      default: [],
    },
    updatedByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true },
);

classAttendanceSchema.index({ sectionId: 1, sessionDate: 1 }, { unique: true });

module.exports = mongoose.models.ClassAttendance || mongoose.model('ClassAttendance', classAttendanceSchema);
