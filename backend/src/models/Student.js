const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    firstName: { type: String, required: true },
    middleName: { type: String, default: "" },
    lastName: { type: String, required: true },
    gender: { type: String, default: "" },
    dob: { type: String, default: "" },
    program: { type: String, default: "" },
    yearLevel: { type: String, default: "" },
    sectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Section",
      default: null,
    },
    section: { type: String, default: "" },
    status: { type: String, default: "" },
    studentType: { type: String, enum: ['Regular', 'Irregular'], default: 'Regular' },
    scholarship: { type: String, default: "" },
    profileAvatar: { type: String, default: "" },
    email: { type: String, default: "" },
    contact: { type: String, default: "" },
    dateEnrolled: { type: String, default: "" },
    guardian: { type: String, default: "" },
    guardianContact: { type: String, default: "" },
    violation: { type: String, default: "" },
    skills: { type: [String], default: [] },
    // Expanded fields Phase 2
    address: {
      street: { type: String, default: "" },
      city: { type: String, default: "" },
      province: { type: String, default: "" },
      postalCode: { type: String, default: "" },
    },
    emergencyContact: {
      name: { type: String, default: "" },
      relationship: { type: String, default: "" },
      phone: { type: String, default: "" },
    },
    academicHistory: {
      previousSchools: { type: [String], default: [] },
      achievements: { type: [String], default: [] },
    },
    healthInfo: {
      conditions: { type: [String], default: [] },
      medications: { type: [String], default: [] },
      allergies: { type: [String], default: [] },
    },
  },
  {
    id: false,
    timestamps: false,
    toJSON: {
      transform(_doc, ret) {
        // Keep MongoDB `_id` so the frontend can edit using the primary identifier.
        if (ret._id && typeof ret._id.toString === "function") {
          ret._id = ret._id.toString();
        }
        delete ret.__v;
        return ret;
      },
    },
  },
);

module.exports = mongoose.model("Student", studentSchema);
