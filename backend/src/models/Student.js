const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    firstName: { type: String, required: true },
    middleName: { type: String, default: '' },
    lastName: { type: String, required: true },
    gender: { type: String, default: '' },
    dob: { type: String, default: '' },
    program: { type: String, default: '' },
    yearLevel: { type: String, default: '' },
    section: { type: String, default: '' },
    status: { type: String, default: '' },
    scholarship: { type: String, default: '' },
    profileAvatar: { type: String, default: '' },
    email: { type: String, default: '' },
    contact: { type: String, default: '' },
    dateEnrolled: { type: String, default: '' },
    guardian: { type: String, default: '' },
    guardianContact: { type: String, default: '' },
    violation: { type: String, default: '' },
    skills: { type: [String], default: [] },
  },
  {
    id: false,
    timestamps: false,
    toJSON: {
      transform(_doc, ret) {
        // Keep MongoDB `_id` so the frontend can edit using the primary identifier.
        if (ret._id && typeof ret._id.toString === 'function') {
          ret._id = ret._id.toString();
        }
        delete ret.__v;
        return ret;
      },
    },
  },
);

module.exports = mongoose.model('Student', studentSchema);
