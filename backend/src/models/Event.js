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

const attendeeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rsvpStatus: {
    type: String,
    enum: ['registered', 'waitlisted'],
    default: 'registered'
  },
  attended: {
    type: Boolean,
    default: false
  }
}, { _id: false });

const waitlistEntrySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  addedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const feedbackSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    default: ''
  },
  submittedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const eventSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['Curricular', 'Extra-Curricular', 'Other'],
    required: true
  },
  typeOtherLabel: {
    type: String,
    trim: true
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
  attendees: {
    type: [attendeeSchema],
    default: []
  },
  waitlist: {
    type: [waitlistEntrySchema],
    default: []
  },
  rsvpClosed: {
    type: Boolean,
    default: false
  },
  rsvpClosedAt: {
    type: Date
  },
  cancelledAt: {
    type: Date
  },
  cancelReason: {
    type: String
  },
  feedbackEnabled: {
    type: Boolean,
    default: false
  },
  feedback: {
    type: [feedbackSchema],
    default: []
  },
  certificatesGenerated: {
    type: Boolean,
    default: false
  },
  certificatesGeneratedAt: {
    type: Date
  },
  attendanceLocked: {
    type: Boolean,
    default: false
  },
  attendanceLockedAt: {
    type: Date
  }
}, {
  timestamps: true
});

eventSchema.index({ 'schedule.startTime': 1, rsvpClosed: 1 });

module.exports = mongoose.model('Event', eventSchema);
