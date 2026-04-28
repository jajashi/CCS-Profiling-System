const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const passwordChangeRequestSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    requestedPassword: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected'],
      default: 'Pending',
      index: true,
    },
    adminNotes: {
      type: String,
      default: '',
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    approvedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

/** Hash the requested password before saving if it has changed. */
passwordChangeRequestSchema.pre('save', async function (next) {
  if (!this.isModified('requestedPassword')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.requestedPassword = await bcrypt.hash(this.requestedPassword, salt);
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model('PasswordChangeRequest', passwordChangeRequestSchema);
