const mongoose = require('mongoose');

const MOBILE_REGEX = /^09\d{9}$/;
const DATE_STRING_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const URL_REGEX = /^https?:\/\/\S+$/i;

const facultySchema = new mongoose.Schema(
  {
    employeeId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    firstName: { type: String, required: true, trim: true },
    middleName: { type: String, default: '', trim: true },
    lastName: { type: String, required: true, trim: true },
    dob: {
      type: String,
      required: true,
      validate: {
        validator(value) {
          return DATE_STRING_REGEX.test(value);
        },
        message: 'dob must be an ISO date string in YYYY-MM-DD format.',
      },
    },
    department: {
      type: String,
      enum: ['IT', 'CS'],
      required: true,
    },
    profileAvatar: {
      type: String,
      default: '',
      trim: true,
      validate: {
        validator(value) {
          return !value || URL_REGEX.test(value);
        },
        message: 'profileAvatar must be a valid URL.',
      },
    },
    institutionalEmail: {
      type: String,
      required: true,
      unique: true,
      index: true,
      lowercase: true,
      trim: true,
    },
    personalEmail: { type: String, default: '', trim: true, lowercase: true },
    mobileNumber: {
      type: String,
      required: true,
      validate: {
        validator(value) {
          return MOBILE_REGEX.test(value);
        },
        message: 'mobileNumber must start with 09 and contain exactly 11 digits.',
      },
    },
    emergencyContactName: { type: String, default: '', trim: true },
    emergencyContactNumber: {
      type: String,
      default: '',
      validate: {
        validator(value) {
          return !value || MOBILE_REGEX.test(value);
        },
        message:
          'emergencyContactNumber must start with 09 and contain exactly 11 digits.',
      },
    },
    position: { type: String, required: true, trim: true },
    employmentType: {
      type: String,
      enum: ['Full-time', 'Part-time'],
      required: true,
    },
    contractType: { type: String, default: '', trim: true },
    dateHired: {
      type: String,
      required: true,
      validate: {
        validator(value) {
          return DATE_STRING_REGEX.test(value);
        },
        message: 'dateHired must be an ISO date string in YYYY-MM-DD format.',
      },
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive'],
      default: 'Active',
    },
    inactiveReason: {
      type: String,
      default: '',
      trim: true,
      required() {
        return this.status === 'Inactive';
      },
    },
    highestEducation: { type: String, required: true, trim: true },
    fieldOfStudy: { type: String, required: true, trim: true },
    certifications: { type: String, default: '', trim: true },
    specializations: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Specialization',
      },
    ],
    internalNotes: { type: String, default: '', trim: true },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
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

facultySchema.virtual('yearsOfService').get(function yearsOfServiceGetter() {
  if (!this.dateHired || !DATE_STRING_REGEX.test(this.dateHired)) {
    return 0;
  }

  const hiredDate = new Date(`${this.dateHired}T00:00:00.000Z`);
  if (Number.isNaN(hiredDate.getTime())) {
    return 0;
  }

  const now = new Date();
  let years = now.getUTCFullYear() - hiredDate.getUTCFullYear();
  const monthDiff = now.getUTCMonth() - hiredDate.getUTCMonth();
  const dayDiff = now.getUTCDate() - hiredDate.getUTCDate();
  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    years -= 1;
  }
  return Math.max(0, years);
});

module.exports = mongoose.model('Faculty', facultySchema);
