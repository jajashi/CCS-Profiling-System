const mongoose = require('mongoose');

const advisingNoteSchema = new mongoose.Schema(
  {
    sectionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Section', required: true, index: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    note: { type: String, required: true, trim: true, maxlength: 2000 },
    flags: { type: [String], default: [] },
    referralStatus: {
      type: String,
      enum: ['none', 'pending', 'referred', 'closed'],
      default: 'none',
    },
    createdByUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    updatedByUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true },
);

module.exports = mongoose.models.AdvisingNote || mongoose.model('AdvisingNote', advisingNoteSchema);
