const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema(
  {
    actorUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    actorRole: {
      type: String,
      enum: ['admin', 'faculty'],
      required: true,
      index: true,
    },
    actorName: {
      type: String,
      default: '',
      trim: true,
    },
    actorIdentifier: {
      type: String,
      default: '',
      trim: true,
    },
    action: {
      type: String,
      required: true,
      trim: true,
    },
    module: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    target: {
      type: String,
      default: '',
      trim: true,
    },
    status: {
      type: String,
      enum: ['Completed', 'Pending', 'Published', 'Failed'],
      default: 'Completed',
      index: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

activityLogSchema.index({ createdAt: -1, module: 1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
