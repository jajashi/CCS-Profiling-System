const mongoose = require('mongoose');

const organizerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  role: {
    type: String,
    required: true
  }
}, { _id: false });

const scheduleSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  }
}, { _id: false });

const eventSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['Curricular', 'Extra-Curricular'],
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'pending_approval', 'published', 'cancelled', 'completed'],
    default: 'draft'
  },
  schedule: {
    type: scheduleSchema,
    required: true
  },
  timezone: {
    type: String,
    default: 'UTC'
  },
  isVirtual: {
    type: Boolean,
    default: false
  },
  meetingUrl: {
    type: String,
    required: function() { return this.isVirtual; }
  },
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: function() { return !this.isVirtual; }
  },
  title: {
    type: String,
    required: true
  },
  targetGroups: {
    roles: [{ type: String }],
    programs: [{ type: String }],
    yearLevels: [{ type: String }]
  },
  attachments: [{
    name: String,
    url: String,
    type: String
  }],
  organizers: [organizerSchema],
  cancelledAt: {
    type: Date
  },
  cancelReason: {
    type: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Event', eventSchema);
