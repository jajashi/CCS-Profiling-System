const mongoose = require('mongoose');

const ROOM_TYPE_ENUM = ['Lecture', 'IT Lab', 'Biology Lab', 'Multipurpose'];
const ROOM_STATUS_ENUM = ['Active', 'Maintenance', 'Archived'];

const roomSchema = new mongoose.Schema(
  {
    roomCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      enum: ROOM_TYPE_ENUM,
    },
    maximumCapacity: {
      type: Number,
      required: true,
      min: 1,
    },
    building: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ROOM_STATUS_ENUM,
      default: 'Active',
    },
    description: {
      type: String,
      trim: true,
      default: '',
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

// Indexed capacity + status for scheduler queries (e.g. rooms Active with capacity >= N)
roomSchema.index({ status: 1, maximumCapacity: 1 });
roomSchema.index({ type: 1, status: 1 });

const Room = mongoose.model('Room', roomSchema);

Room.TYPE_ENUM = ROOM_TYPE_ENUM;
Room.STATUS_ENUM = ROOM_STATUS_ENUM;

module.exports = Room;
