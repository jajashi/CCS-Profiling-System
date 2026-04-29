const User = require('../models/User');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');

function buildDisplayName(parts) {
  return parts.map((p) => String(p || '').trim()).filter(Boolean).join(' ').trim();
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function parseDobToMmddyyyy(dobValue) {
  const raw = String(dobValue || '').trim();
  if (!raw) return null;

  // Accept ISO-like input and keep date interpretation stable.
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const [, year, month, day] = match;
  return `${month}${day}${year}`;
}

function publicUser(userDoc) {
  return {
    id: userDoc._id,
    username: userDoc.username,
    name: userDoc.name,
    role: userDoc.role,
    isActive: userDoc.isActive !== false,
    mustChangePassword: userDoc.mustChangePassword === true,
    studentId: userDoc.studentId || null,
    employeeId: userDoc.employeeId || null,
  };
}

function toPositiveInt(value, fallback) {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
}

function paginateRows(rows, page, limit) {
  const total = rows.length;
  const totalPages = Math.max(Math.ceil(total / limit), 1);
  const currentPage = Math.min(Math.max(page, 1), totalPages);
  const start = (currentPage - 1) * limit;
  const items = rows.slice(start, start + limit);
  return { items, total, currentPage, totalPages, limit };
}

function buildSummary(rows) {
  return rows.reduce(
    (acc, row) => {
      const hasAccount = Boolean(row.hasAccount || row.id);
      const isActive = row.account?.isActive ?? row.isActive;
      const mustChange = row.account?.mustChangePassword ?? row.mustChangePassword;
      if (hasAccount) acc.withAccount += 1;
      else acc.withoutAccount += 1;
      if (hasAccount && isActive) acc.active += 1;
      if (hasAccount && !isActive) acc.inactive += 1;
      if (hasAccount && mustChange) acc.mustChange += 1;
      return acc;
    },
    { withAccount: 0, withoutAccount: 0, active: 0, inactive: 0, mustChange: 0 },
  );
}

function matchesAccountFilter(row, accountFilter) {
  const filter = String(accountFilter || 'all').trim();
  if (!filter || filter === 'all') return true;
  const hasAccount = Boolean(row.hasAccount || row.id);
  const isActive = row.account?.isActive ?? row.isActive;
  const mustChangePassword = row.account?.mustChangePassword ?? row.mustChangePassword;
  if (filter === 'with-account') return hasAccount;
  if (filter === 'without-account') return !hasAccount;
  if (filter === 'active') return hasAccount && isActive === true;
  if (filter === 'inactive') return hasAccount && isActive === false;
  if (filter === 'must-change') return hasAccount && mustChangePassword === true;
  return true;
}

function normalizeFlagFilter(value) {
  const v = String(value || '').trim().toLowerCase();
  if (!v || v === 'all') return 'all';
  return v;
}

function matchesAdvancedFilters(row, filters = {}) {
  const hasAccount = Boolean(row.hasAccount || row.id);
  const isActive = row.account?.isActive ?? row.isActive;
  const mustChangePassword = row.account?.mustChangePassword ?? row.mustChangePassword;

  const accountState = normalizeFlagFilter(filters.accountState);
  const status = normalizeFlagFilter(filters.status);
  const passwordState = normalizeFlagFilter(filters.passwordState);

  if (accountState === 'with-account' && !hasAccount) return false;
  if (accountState === 'without-account' && hasAccount) return false;

  if (status === 'active' && !(hasAccount && isActive === true)) return false;
  if (status === 'inactive' && !(hasAccount && isActive === false)) return false;

  if (passwordState === 'must-change' && !(hasAccount && mustChangePassword === true)) return false;
  if (passwordState === 'updated' && !(hasAccount && mustChangePassword === false)) return false;

  return true;
}

async function listAccounts(req, res, next) {
  try {
    const { role, search, accountFilter, accountState, status, passwordState } = req.query || {};
    const page = toPositiveInt(req.query?.page, 1);
    const limit = Math.min(toPositiveInt(req.query?.limit, 20), 100);
    const query = {};

    if (role && ['admin', 'faculty', 'student'].includes(String(role).trim())) {
      query.role = String(role).trim();
    }

    const searchText = String(search || '').trim();
    if (searchText) {
      const pattern = new RegExp(searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      query.$or = [
        { username: pattern },
        { name: pattern },
        { studentId: pattern },
        { employeeId: pattern },
      ];
    }

    const rows = await User.find(query)
      .sort({ createdAt: -1 })
      .select('_id username name role isActive mustChangePassword studentId employeeId createdAt updatedAt')
      .lean();

    const mappedRows = rows
      .map((row) => ({
        id: row._id,
        username: row.username,
        name: row.name,
        role: row.role,
        isActive: row.isActive !== false,
        mustChangePassword: row.mustChangePassword === true,
        studentId: row.studentId || null,
        employeeId: row.employeeId || null,
        createdAt: row.createdAt || null,
        updatedAt: row.updatedAt || null,
      }))
      .filter((row) => matchesAccountFilter(row, accountFilter))
      .filter((row) => matchesAdvancedFilters(row, { accountState, status, passwordState }));

    const paged = paginateRows(mappedRows, page, limit);
    const summary = buildSummary(mappedRows);
    const activeAdminCount = await User.countDocuments({ role: 'admin', isActive: { $ne: false } });

    return res.status(200).json({
      ...paged,
      summary,
      activeAdminCount,
    });
  } catch (err) {
    return next(err);
  }
}

async function listStudentAccountProfiles(req, res, next) {
  try {
    const search = String(req.query?.search || '').trim();
    const accountFilter = String(req.query?.accountFilter || 'all').trim();
    const accountState = req.query?.accountState;
    const status = req.query?.status;
    const passwordState = req.query?.passwordState;
    const page = toPositiveInt(req.query?.page, 1);
    const limit = Math.min(toPositiveInt(req.query?.limit, 20), 100);
    const pattern = search ? new RegExp(escapeRegex(search), 'i') : null;
    const studentQuery = pattern
      ? {
          $or: [{ id: pattern }, { firstName: pattern }, { middleName: pattern }, { lastName: pattern }],
        }
      : {};

    const [students, accounts] = await Promise.all([
      Student.find(studentQuery, { id: 1, firstName: 1, middleName: 1, lastName: 1, dob: 1 }).sort({ id: 1 }).lean(),
      User.find({ role: 'student' }, { _id: 1, username: 1, studentId: 1, isActive: 1, mustChangePassword: 1 }).lean(),
    ]);

    const byStudentId = new Map();
    accounts.forEach((acc) => {
      if (acc.studentId) byStudentId.set(String(acc.studentId), acc);
    });

    const rows = students
      .map((s) => {
        const account = byStudentId.get(String(s.id)) || null;
        return {
          profileId: String(s.id),
          name: buildDisplayName([s.firstName, s.middleName, s.lastName]) || String(s.id),
          dob: s.dob || '',
          hasAccount: Boolean(account),
          account: account
            ? {
                id: account._id,
                username: account.username,
                isActive: account.isActive !== false,
                mustChangePassword: account.mustChangePassword === true,
              }
            : null,
        };
      })
      .filter((row) => matchesAccountFilter(row, accountFilter))
      .filter((row) => matchesAdvancedFilters(row, { accountState, status, passwordState }));

    const paged = paginateRows(rows, page, limit);
    const summary = buildSummary(rows);
    return res.status(200).json({
      ...paged,
      summary,
    });
  } catch (err) {
    return next(err);
  }
}

async function listFacultyAccountProfiles(req, res, next) {
  try {
    const search = String(req.query?.search || '').trim();
    const accountFilter = String(req.query?.accountFilter || 'all').trim();
    const accountState = req.query?.accountState;
    const status = req.query?.status;
    const passwordState = req.query?.passwordState;
    const page = toPositiveInt(req.query?.page, 1);
    const limit = Math.min(toPositiveInt(req.query?.limit, 20), 100);
    const pattern = search ? new RegExp(escapeRegex(search), 'i') : null;
    const facultyQuery = pattern
      ? {
          $or: [{ employeeId: pattern }, { firstName: pattern }, { middleName: pattern }, { lastName: pattern }],
        }
      : {};

    const [facultyRows, accounts] = await Promise.all([
      Faculty.find(facultyQuery, { employeeId: 1, firstName: 1, middleName: 1, lastName: 1, dob: 1 })
        .sort({ employeeId: 1 })
        .lean(),
      User.find({ role: 'faculty' }, { _id: 1, username: 1, employeeId: 1, isActive: 1, mustChangePassword: 1 }).lean(),
    ]);

    const byEmployeeId = new Map();
    accounts.forEach((acc) => {
      if (acc.employeeId) byEmployeeId.set(String(acc.employeeId).toLowerCase(), acc);
    });

    const rows = facultyRows
      .map((f) => {
        const key = String(f.employeeId || '').toLowerCase();
        const account = byEmployeeId.get(key) || null;
        return {
          profileId: String(f.employeeId || ''),
          name: buildDisplayName([f.firstName, f.middleName, f.lastName]) || String(f.employeeId || ''),
          dob: f.dob || '',
          hasAccount: Boolean(account),
          account: account
            ? {
                id: account._id,
                username: account.username,
                isActive: account.isActive !== false,
                mustChangePassword: account.mustChangePassword === true,
              }
            : null,
        };
      })
      .filter((row) => matchesAccountFilter(row, accountFilter))
      .filter((row) => matchesAdvancedFilters(row, { accountState, status, passwordState }));

    const paged = paginateRows(rows, page, limit);
    const summary = buildSummary(rows);
    return res.status(200).json({
      ...paged,
      summary,
    });
  } catch (err) {
    return next(err);
  }
}

async function createAdminAccount(req, res, next) {
  try {
    const { username, name } = req.body || {};
    const u = String(username || '').trim();
    const n = String(name || '').trim();

    if (!u || !n) {
      return res.status(400).json({ message: 'username and name are required.' });
    }

    const exists = await User.findOne({ username: u }).lean();
    if (exists) {
      return res.status(409).json({ message: 'Username is already in use.' });
    }

    const created = await User.create({
      username: u,
      // For newly-created admin accounts, temporary password is username.
      password: u,
      name: n,
      role: 'admin',
      isActive: true,
      mustChangePassword: true,
      isNewAccount: true,
    });

    return res.status(201).json({ user: publicUser(created) });
  } catch (err) {
    return next(err);
  }
}

async function provisionStudentAccount(req, res, next) {
  try {
    const studentId = String(req.params.studentId || '').trim();
    const { name } = req.body || {};

    if (!studentId) {
      return res.status(400).json({ message: 'studentId is required.' });
    }

    const student = await Student.findOne({ id: studentId }).lean();
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found.' });
    }

    const duplicate = await User.findOne({
      $or: [{ username: studentId }, { studentId }],
    }).lean();
    if (duplicate) {
      return res.status(409).json({ message: 'Student login account already exists for this student ID.' });
    }

    const resolvedPassword = parseDobToMmddyyyy(student.dob);
    if (!resolvedPassword) {
      return res.status(400).json({
        message: 'Student birth date is missing or invalid. Expected YYYY-MM-DD in student profile.',
      });
    }

    const resolvedName =
      String(name || '').trim() ||
      buildDisplayName([student.firstName, student.middleName, student.lastName]) ||
      studentId;

    const created = await User.create({
      username: studentId,
      password: resolvedPassword,
      name: resolvedName,
      role: 'student',
      studentId,
      isActive: true,
      mustChangePassword: true,
      isNewAccount: true,
    });

    return res.status(201).json({
      user: publicUser(created),
      temporaryPassword: resolvedPassword,
    });
  } catch (err) {
    return next(err);
  }
}

async function provisionFacultyAccount(req, res, next) {
  try {
    const employeeId = String(req.params.employeeId || '').trim();
    const { name } = req.body || {};

    if (!employeeId) {
      return res.status(400).json({ message: 'employeeId is required.' });
    }

    const faculty = await Faculty.findOne({
      employeeId: new RegExp(`^${escapeRegex(employeeId)}$`, 'i'),
    }).lean();
    if (!faculty) {
      return res.status(404).json({ message: 'Faculty profile not found.' });
    }

    const canonicalEmployeeId = String(faculty.employeeId || '').trim();
    const duplicate = await User.findOne({
      $or: [{ username: canonicalEmployeeId }, { employeeId: canonicalEmployeeId }],
    }).lean();
    if (duplicate) {
      return res.status(409).json({ message: 'Faculty login account already exists for this employee ID.' });
    }

    const resolvedPassword = parseDobToMmddyyyy(faculty.dob);
    if (!resolvedPassword) {
      return res.status(400).json({
        message: 'Faculty birth date is missing or invalid. Expected YYYY-MM-DD in faculty profile.',
      });
    }

    const resolvedName =
      String(name || '').trim() ||
      buildDisplayName([faculty.firstName, faculty.middleName, faculty.lastName]) ||
      canonicalEmployeeId;

    const created = await User.create({
      username: canonicalEmployeeId,
      password: resolvedPassword,
      name: resolvedName,
      role: 'faculty',
      employeeId: canonicalEmployeeId,
      isActive: String(faculty.status || 'Active') !== 'Inactive',
      mustChangePassword: true,
      isNewAccount: true,
    });

    return res.status(201).json({
      user: publicUser(created),
      temporaryPassword: resolvedPassword,
    });
  } catch (err) {
    return next(err);
  }
}

async function resetAccountPassword(req, res, next) {
  try {
    const id = String(req.params.id || '').trim();

    if (!id) {
      return res.status(400).json({ message: 'Account id is required.' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User account not found.' });
    }

    let resolvedPassword = null;
    if (user.role === 'student' && user.studentId) {
      const student = await Student.findOne({ id: user.studentId }, { dob: 1 }).lean();
      resolvedPassword = parseDobToMmddyyyy(student?.dob);
    } else if (user.role === 'faculty' && user.employeeId) {
      const faculty = await Faculty.findOne(
        { employeeId: new RegExp(`^${escapeRegex(user.employeeId)}$`, 'i') },
        { dob: 1 },
      ).lean();
      resolvedPassword = parseDobToMmddyyyy(faculty?.dob);
    }

    if (!resolvedPassword && user.role === 'admin') {
      // Admin reset flow: temporary password is the username.
      resolvedPassword = String(user.username || '').trim();
    }

    if (!resolvedPassword) {
      return res.status(400).json({
        message:
          'Cannot reset password to birthday because linked profile birth date is missing or invalid.',
      });
    }

    user.password = resolvedPassword;
    user.mustChangePassword = true;
    await user.save();

    return res.status(200).json({
      user: publicUser(user),
      temporaryPassword: resolvedPassword,
    });
  } catch (err) {
    return next(err);
  }
}

async function updateAccountStatus(req, res, next) {
  try {
    const id = String(req.params.id || '').trim();
    const { isActive } = req.body || {};

    if (!id) {
      return res.status(400).json({ message: 'Account id is required.' });
    }
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ message: 'isActive (boolean) is required.' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User account not found.' });
    }

    if (user.role === 'admin' && isActive === false) {
      const activeAdminCount = await User.countDocuments({ role: 'admin', isActive: { $ne: false } });
      if (activeAdminCount <= 1) {
        return res.status(400).json({
          message: 'At least one active admin account is required. You cannot deactivate the last admin.',
        });
      }
    }

    user.isActive = isActive;
    await user.save();

    return res.status(200).json({ user: publicUser(user) });
  } catch (err) {
    return next(err);
  }
}

async function deleteAccount(req, res, next) {
  try {
    const id = String(req.params.id || '').trim();
    if (!id) {
      return res.status(400).json({ message: 'Account id is required.' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User account not found.' });
    }

    if (user.role === 'admin') {
      const [totalAdminCount, activeAdminCount] = await Promise.all([
        User.countDocuments({ role: 'admin' }),
        User.countDocuments({ role: 'admin', isActive: { $ne: false } }),
      ]);

      if (totalAdminCount <= 1) {
        return res.status(400).json({
          message: 'At least one admin account must exist. You cannot delete the last admin.',
        });
      }

      if (user.isActive !== false && activeAdminCount <= 1) {
        return res.status(400).json({
          message: 'At least one active admin account is required. You cannot delete the last active admin.',
        });
      }
    }

    await User.findByIdAndDelete(id);
    return res.status(200).json({ success: true });
  } catch (err) {
    return next(err);
  }
}

async function searchUsers(req, res, next) {
  try {
    const { q } = req.query;
    const limit = Math.min(toPositiveInt(req.query?.limit, 10), 50);
    if (!q || String(q).trim().length < 2) return res.status(200).json([]);

    const pattern = new RegExp(escapeRegex(q), 'i');
    const users = await User.find({
      $or: [
        { name: pattern },
        { username: pattern },
        { studentId: pattern },
        { employeeId: pattern },
      ],
    })
      .limit(limit)
      .select('_id name username role studentId employeeId')
      .lean();

    return res.status(200).json(users.map(publicUser));
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  listAccounts,
  listStudentAccountProfiles,
  listFacultyAccountProfiles,
  searchUsers,
  createAdminAccount,
  provisionStudentAccount,
  provisionFacultyAccount,
  resetAccountPassword,
  updateAccountStatus,
  deleteAccount,
};
