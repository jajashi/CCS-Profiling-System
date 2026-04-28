const mongoose = require('mongoose');

const referenceOptionSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      enum: ['Skill', 'Violation'],
      required: true,
      index: true,
    },
    value: {
      type: String,
      required: true,
      trim: true,
    },
    label: {
      type: String,
      required: true,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure value is unique within a category
referenceOptionSchema.index({ category: 1, value: 1 }, { unique: true });

module.exports = mongoose.model('ReferenceOption', referenceOptionSchema);
