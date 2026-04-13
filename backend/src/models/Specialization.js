const mongoose = require('mongoose');

const specializationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
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

module.exports = mongoose.model('Specialization', specializationSchema);
