const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require("bcryptjs");
const { getJwtSecret } = require('../config/jwtSecret');

const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    const user = await User.findOne({ username: username.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid username' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid password' });
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
        studentId: user.studentId,
        ...(facultyEmployeeId ? { employeeId: facultyEmployeeId } : {}),
      }
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  login,
};
