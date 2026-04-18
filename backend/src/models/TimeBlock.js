const mongoose = require('mongoose');

const DAY_ENUM = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const STATUS_ENUM = ['Active', 'Archived'];

const timeBlockSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      required: true,
      trim: true,
    },
    durationMinutes: {
      type: Number,
      required: true,
      min: 1,
    },
    daysOfWeek: {
      type: [String],
      default: [],
      validate: {
        validator(arr) {
          if (!Array.isArray(arr)) return false;
          return arr.every((d) => DAY_ENUM.includes(d));
        },
        message: `daysOfWeek must be values from: ${DAY_ENUM.join(', ')}.`,
      },
    },
    startTime: {
      type: String,
      required: true,
      trim: true,
    },
    endTime: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: STATUS_ENUM,
      default: 'Active',
    },
    curriculumId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Curriculum',
      default: null,
      index: true,
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

timeBlockSchema.index({ status: 1, label: 1 });

const TimeBlock = mongoose.model('TimeBlock', timeBlockSchema);

TimeBlock.DAY_ENUM = DAY_ENUM;
TimeBlock.STATUS_ENUM = STATUS_ENUM;

module.exports = TimeBlock;
