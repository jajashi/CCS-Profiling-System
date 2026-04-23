const mongoose = require('mongoose');
const Faculty = require('../models/Faculty');
const Specialization = require('../models/Specialization');
const { logActivity } = require('../services/activityLogService');

const MOBILE_REGEX = /^09\d{9}$/;
const DATE_STRING_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function normalizeString(value) {
  return String(value ?? '').trim();
}

/** Escape user input so it is matched literally in RegExp (story 3.3: case-insensitive substring search). */
function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function generateNextEmployeeId() {
  const year = new Date().getUTCFullYear();
  const prefix = `FAC-${year}-`;
  const pattern = new RegExp(`^${prefix}\\d{3}$`);

  const existing = await Faculty.find({ employeeId: pattern }, { employeeId: 1, _id: 0 }).lean();
  const maxSuffix = existing.reduce((max, row) => {
    const value = String(row.employeeId || '');
    const suffix = Number.parseInt(value.slice(prefix.length), 10);
    if (!Number.isInteger(suffix)) return max;
    return suffix > max ? suffix : max;
  }, 0);

  const next = maxSuffix + 1;
  return `${prefix}${String(next).padStart(3, '0')}`;
}

function validatePayload(payload, isCreate) {
  const requiredFields = [
    'firstName',
    'lastName',
    'dob',
    'department',
    'institutionalEmail',
    'mobileNumber',
    'position',
    'employmentType',
    'dateHired',
    'highestEducation',
    'fieldOfStudy',
  ];

  const missing = requiredFields.filter((key) => {
    const value = payload[key];
    return value === undefined || value === null || String(value).trim().length === 0;
  });

  if (missing.length > 0) {
    return `Missing required field(s): ${missing.join(', ')}`;
  }

  if (!DATE_STRING_REGEX.test(normalizeString(payload.dob))) {
    return 'dob must be an ISO date string in YYYY-MM-DD format.';
  }

  if (!DATE_STRING_REGEX.test(normalizeString(payload.dateHired))) {
    return 'dateHired must be an ISO date string in YYYY-MM-DD format.';
  }

  if (!MOBILE_REGEX.test(normalizeString(payload.mobileNumber))) {
    return 'mobileNumber must start with 09 and contain exactly 11 digits.';
  }

  const emergencyContactNumber = normalizeString(payload.emergencyContactNumber);
  if (emergencyContactNumber && !MOBILE_REGEX.test(emergencyContactNumber)) {
    return 'emergencyContactNumber must start with 09 and contain exactly 11 digits.';
  }

  const status = normalizeString(payload.status || 'Active') || 'Active';
  if (status === 'Inactive' && !normalizeString(payload.inactiveReason)) {
    return 'inactiveReason is required when status is Inactive.';
  }

  if (!isCreate && payload.employeeId) {
    const expected = /^FAC-\d{4}-\d{3}$/;
    if (!expected.test(normalizeString(payload.employeeId))) {
      return 'employeeId must follow FAC-YYYY-NNN format.';
    }
  }

  return null;
}

async function resolveSpecializationIds(specializations) {
  if (!Array.isArray(specializations)) return [];

  const ids = [];
  for (const rawValue of specializations) {
    const value = normalizeString(rawValue);
    if (!value) continue;

    if (mongoose.Types.ObjectId.isValid(value)) {
      ids.push(new mongoose.Types.ObjectId(value));
      continue;
    }

    const found = await Specialization.findOne({ name: value }).lean();
    if (found) {
      ids.push(new mongoose.Types.ObjectId(found._id));
    }
  }

  return ids;
}

function mapFacultyResponse(doc) {
  const json = doc.toJSON();
  delete json.id;
  return json;
}

/** Faculty role may only access their own record; requires employeeId on the JWT. */
function requireFacultyEmployeeId(req) {
  if (req.user.role !== 'faculty') return null;
  const emp = req.user.employeeId != null ? String(req.user.employeeId).trim() : '';
  if (!emp) {
    return {
      status: 403,
      body: {
        message:
          'Faculty account is not linked to an employee ID. Ask an administrator to link your account.',
      },
    };
  }
  return emp;
}

function normalizeEmployeeIdParam(value) {
  return String(value ?? '').trim();
}

async function getFaculty(req, res, next) {
  try {
    const facultyScope = requireFacultyEmployeeId(req);
    if (facultyScope && facultyScope.status) {
      return res.status(facultyScope.status).json(facultyScope.body);
    }

    const { search, department, employmentType, status, specialization, page: pageParam, limit: limitParam } =
      req.query;
    const query = {};
    if (facultyScope) {
      query.employeeId = new RegExp(`^${escapeRegex(facultyScope)}$`, 'i');
    }
    const usePagination = pageParam != null || limitParam != null;
    const limit = Math.min(Math.max(parseInt(limitParam, 10) || 50, 1), 100);
    const currentPage = Math.max(parseInt(pageParam, 10) || 1, 1);

    if (search) {
      const trimmed = String(search).trim();
      if (trimmed) {
        const pattern = new RegExp(escapeRegex(trimmed), 'i');
        query.$or = [
          { employeeId: pattern },
          { firstName: pattern },
          { middleName: pattern },
          { lastName: pattern },
          { institutionalEmail: pattern },
        ];
      }
    }

    if (department) query.department = String(department).trim();
    if (employmentType) query.employmentType = String(employmentType).trim();
    if (status) query.status = String(status).trim();

    if (specialization) {
      const values = String(specialization)
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean);

      const specializationIds = [];
      for (const value of values) {
        if (mongoose.Types.ObjectId.isValid(value)) {
          specializationIds.push(new mongoose.Types.ObjectId(value));
          continue;
        }
        const found = await Specialization.findOne({ name: value }).lean();
        if (found) specializationIds.push(new mongoose.Types.ObjectId(found._id));
      }

      if (specializationIds.length > 0) {
        query.specializations = { $in: specializationIds };
      } else if (usePagination) {
        return res.status(200).json({
          faculty: [],
          total: 0,
          currentPage: 1,
          totalPages: 1,
          limit,
        });
      } else {
        return res.status(200).json([]);
      }
    }

    if (usePagination) {
      const total = await Faculty.countDocuments(query);
      const totalPages = Math.max(Math.ceil(total / limit), 1);
      const safePage = Math.min(currentPage, totalPages);
      const skip = (safePage - 1) * limit;

      const faculty = await Faculty.find(query)
        .populate('specializations', 'name description')
        .skip(skip)
        .limit(limit);

      return res.status(200).json({
        faculty: faculty.map(mapFacultyResponse),
        total,
        currentPage: safePage,
        totalPages,
        limit,
      });
    }

    const faculty = await Faculty.find(query).populate('specializations', 'name description');
    return res.status(200).json(faculty.map(mapFacultyResponse));
  } catch (err) {
    return next(err);
  }
}

async function getNextFacultyIdPreview(req, res, next) {
  try {
    const employeeId = await generateNextEmployeeId();
    return res.status(200).json({ employeeId });
  } catch (err) {
    return next(err);
  }
}

async function getFacultyById(req, res, next) {
  try {
    const { employeeId } = req.params;
    const facultyScope = requireFacultyEmployeeId(req);
    if (facultyScope && facultyScope.status) {
      return res.status(facultyScope.status).json(facultyScope.body);
    }
    if (facultyScope && normalizeEmployeeIdParam(employeeId).toLowerCase() !== facultyScope.toLowerCase()) {
      return res.status(403).json({ message: 'You do not have permission to view this faculty profile.' });
    }

    const faculty = await Faculty.findOne({
      employeeId: new RegExp(`^${escapeRegex(normalizeEmployeeIdParam(employeeId))}$`, 'i'),
    }).populate('specializations', 'name description');

    if (!faculty) {
      return res.status(404).json({ message: 'Faculty record not found.' });
    }

    return res.status(200).json(mapFacultyResponse(faculty));
  } catch (err) {
    return next(err);
  }
}

async function createFaculty(req, res, next) {
  try {
    const payload = req.body || {};
    const validationError = validatePayload(payload, true);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const specializations = await resolveSpecializationIds(payload.specializations);

    const status = normalizeString(payload.status || 'Active') || 'Active';
    const inactiveReason =
      status === 'Active' ? '' : normalizeString(payload.inactiveReason);

    const data = {
      employeeId: await generateNextEmployeeId(),
      firstName: normalizeString(payload.firstName),
      middleName: normalizeString(payload.middleName),
      lastName: normalizeString(payload.lastName),
      dob: normalizeString(payload.dob),
      department: normalizeString(payload.department),
      profileAvatar: normalizeString(payload.profileAvatar),
      institutionalEmail: normalizeString(payload.institutionalEmail).toLowerCase(),
      personalEmail: normalizeString(payload.personalEmail).toLowerCase(),
      mobileNumber: normalizeString(payload.mobileNumber),
      emergencyContactName: normalizeString(payload.emergencyContactName),
      emergencyContactNumber: normalizeString(payload.emergencyContactNumber),
      position: normalizeString(payload.position),
      employmentType: normalizeString(payload.employmentType),
      contractType: normalizeString(payload.contractType),
      dateHired: normalizeString(payload.dateHired),
      status,
      inactiveReason,
      highestEducation: normalizeString(payload.highestEducation),
      fieldOfStudy: normalizeString(payload.fieldOfStudy),
      certifications: normalizeString(payload.certifications),
      specializations,
      internalNotes: normalizeString(payload.internalNotes),
    };

    const created = await Faculty.create(data);
    const populated = await Faculty.findById(created._id).populate('specializations', 'name description');
    await logActivity(req, {
      action: 'Created faculty profile',
      module: 'Faculty Information',
      target: created.employeeId,
      status: 'Completed',
    });
    return res.status(201).json(mapFacultyResponse(populated));
  } catch (err) {
    if (err && err.code === 11000) {
      const key = Object.keys(err.keyPattern || {})[0];
      if (key === 'institutionalEmail') {
        return res.status(400).json({ message: 'A faculty member with this institutionalEmail already exists.' });
      }
      if (key === 'employeeId') {
        return res.status(400).json({ message: 'A faculty member with this employeeId already exists.' });
      }
      return res.status(400).json({ message: 'Duplicate unique value found.' });
    }

    if (err && err.name === 'ValidationError') {
      return res.status(400).json({ message: 'Please check faculty fields and try again.' });
    }

    return next(err);
  }
}

async function updateFaculty(req, res, next) {
  try {
    const { employeeId } = req.params;
    const payload = req.body || {};

    const validationError = validatePayload(payload, false);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const current = await Faculty.findOne({ employeeId });
    if (!current) {
      return res.status(404).json({ message: 'Faculty record not found.' });
    }

    if (payload.updatedAt) {
      const clientUpdatedAt = new Date(payload.updatedAt);
      const serverUpdatedAt = new Date(current.updatedAt);
      const clientTime = clientUpdatedAt.getTime();
      const serverTime = serverUpdatedAt.getTime();

      if (!Number.isNaN(clientTime) && !Number.isNaN(serverTime) && clientTime !== serverTime) {
        return res.status(409).json({
          message: 'This faculty record was modified by another user. Please refresh and try again.',
        });
      }
    }

    const specializations = await resolveSpecializationIds(payload.specializations);

    const status = normalizeString(payload.status || 'Active') || 'Active';
    const inactiveReason =
      status === 'Active' ? '' : normalizeString(payload.inactiveReason);

    const data = {
      firstName: normalizeString(payload.firstName),
      middleName: normalizeString(payload.middleName),
      lastName: normalizeString(payload.lastName),
      dob: normalizeString(payload.dob),
      department: normalizeString(payload.department),
      profileAvatar: normalizeString(payload.profileAvatar),
      institutionalEmail: normalizeString(payload.institutionalEmail).toLowerCase(),
      personalEmail: normalizeString(payload.personalEmail).toLowerCase(),
      mobileNumber: normalizeString(payload.mobileNumber),
      emergencyContactName: normalizeString(payload.emergencyContactName),
      emergencyContactNumber: normalizeString(payload.emergencyContactNumber),
      position: normalizeString(payload.position),
      employmentType: normalizeString(payload.employmentType),
      contractType: normalizeString(payload.contractType),
      dateHired: normalizeString(payload.dateHired),
      status,
      inactiveReason,
      highestEducation: normalizeString(payload.highestEducation),
      fieldOfStudy: normalizeString(payload.fieldOfStudy),
      certifications: normalizeString(payload.certifications),
      specializations,
      internalNotes: normalizeString(payload.internalNotes),
    };

    const updated = await Faculty.findOneAndUpdate({ employeeId }, data, {
      new: true,
      runValidators: true,
    }).populate('specializations', 'name description');

    await logActivity(req, {
      action: 'Updated faculty profile',
      module: 'Faculty Information',
      target: updated?.employeeId || employeeId,
      status: 'Completed',
    });

    return res.status(200).json(mapFacultyResponse(updated));
  } catch (err) {
    if (err && err.code === 11000) {
      const key = Object.keys(err.keyPattern || {})[0];
      if (key === 'institutionalEmail') {
        return res.status(400).json({ message: 'A faculty member with this institutionalEmail already exists.' });
      }
      if (key === 'employeeId') {
        return res.status(400).json({ message: 'A faculty member with this employeeId already exists.' });
      }
      return res.status(400).json({ message: 'Duplicate unique value found.' });
    }

    if (err && err.name === 'ValidationError') {
      return res.status(400).json({ message: 'Please check faculty fields and try again.' });
    }

    return next(err);
  }
}

async function getFacultyAnalytics(_req, res, next) {
  try {
    const [summary] = await Faculty.aggregate([
      {
        $facet: {
          totals: [
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
                active: {
                  $sum: {
                    $cond: [{ $eq: ['$status', 'Active'] }, 1, 0],
                  },
                },
                inactive: {
                  $sum: {
                    $cond: [{ $eq: ['$status', 'Inactive'] }, 1, 0],
                  },
                },
                fullTime: {
                  $sum: {
                    $cond: [{ $eq: ['$employmentType', 'Full-time'] }, 1, 0],
                  },
                },
                partTime: {
                  $sum: {
                    $cond: [{ $eq: ['$employmentType', 'Part-time'] }, 1, 0],
                  },
                },
                itDept: {
                  $sum: {
                    $cond: [{ $eq: ['$department', 'IT'] }, 1, 0],
                  },
                },
                csDept: {
                  $sum: {
                    $cond: [{ $eq: ['$department', 'CS'] }, 1, 0],
                  },
                },
              },
            },
          ],
          departmentDistribution: [
            { $group: { _id: '$department', count: { $sum: 1 } } },
            { $project: { _id: 0, department: '$_id', count: 1 } },
            { $sort: { department: 1 } },
          ],
          employmentTypeDistribution: [
            { $group: { _id: '$employmentType', count: { $sum: 1 } } },
            { $project: { _id: 0, employmentType: '$_id', count: 1 } },
            { $sort: { employmentType: 1 } },
          ],
        },
      },
    ]);

    const totals = summary?.totals?.[0] || {
      total: 0,
      active: 0,
      inactive: 0,
      fullTime: 0,
      partTime: 0,
      itDept: 0,
      csDept: 0,
    };

    return res.status(200).json({
      totalFaculty: totals.total || 0,
      activeFaculty: totals.active || 0,
      inactiveFaculty: totals.inactive || 0,
      fullTimeFaculty: totals.fullTime || 0,
      partTimeFaculty: totals.partTime || 0,
      itDepartmentCount: totals.itDept || 0,
      csDepartmentCount: totals.csDept || 0,
      departmentDistribution: summary?.departmentDistribution || [],
      employmentTypeDistribution: summary?.employmentTypeDistribution || [],
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  getFaculty,
  getFacultyById,
  getNextFacultyIdPreview,
  createFaculty,
  updateFaculty,
  getFacultyAnalytics,
};
