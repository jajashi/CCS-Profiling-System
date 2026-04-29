const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require("bcryptjs");
const { getJwtSecret } = require('../config/jwtSecret');

const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    const trimmedUsername = username != null ? String(username).trim() : '';
    if (!trimmedUsername || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    const user = await User.findOne({ username: trimmedUsername });
    console.log("Login attempt:", { username: trimmedUsername, userFound: !!user });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    if (user.isActive === false) {
      return res.status(403).json({ message: 'Your account is inactive. Please contact an administrator.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    console.log("isMatch:", isMatch, "req.password:", password, "db.password:", user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const trimmedStudentId =
      user.studentId != null && String(user.studentId).trim() !== ''
        ? String(user.studentId).trim()
        : null;

    let facultyEmployeeId = null;
    if (user.role === 'faculty') {
      const fromField = user.employeeId != null ? String(user.employeeId).trim() : '';
      if (fromField) {
        facultyEmployeeId = fromField;
      } else {
        const u = String(user.username || '').trim();
        const m = u.match(/^(FAC)-(\d{4})-(\d{3})$/i);
        if (m) {
          facultyEmployeeId = `${m[1].toUpperCase()}-${m[2]}-${m[3]}`;
        }
      }
    }

    const secret = getJwtSecret();
    const token = jwt.sign(
      {
        id: user._id.toString(),
        role: user.role,
        ...(trimmedStudentId ? { studentId: trimmedStudentId } : {}),
        ...(facultyEmployeeId ? { employeeId: facultyEmployeeId } : {}),
      },
      secret,
      { expiresIn: '24h' },
    );

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        role: user.role,
        isActive: user.isActive !== false,
        mustChangePassword: user.mustChangePassword === true,
        isNewAccount: user.isNewAccount === true,
        studentId: user.studentId,
        ...(facultyEmployeeId ? { employeeId: facultyEmployeeId } : {}),
      }
    });
  } catch (err) {
    next(err);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const { currentPassword, newPassword } = req.body || {};

    if (!userId) {
      return res.status(401).json({ message: 'Authentication required.' });
    }
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required.' });
    }
    if (String(newPassword).length < 8) {
      return res.status(400).json({ message: 'New password must be at least 8 characters long.' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User account not found.' });
    }
    if (user.isActive === false) {
      return res.status(403).json({ message: 'Your account is inactive. Please contact an administrator.' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect.' });
    }

    const shouldShowWelcome = user.isNewAccount === true;
    user.password = String(newPassword);
    user.mustChangePassword = false;
    user.isNewAccount = false;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Password changed successfully.',
      showWelcome: shouldShowWelcome,
    });
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  login,
  changePassword,
};
