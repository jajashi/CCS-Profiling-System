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

    const secret = getJwtSecret();
    const token = jwt.sign(
      {
        id: user._id.toString(),
        role: user.role,
        ...(user.studentId != null && String(user.studentId).trim() !== ''
          ? { studentId: String(user.studentId).trim() }
          : {}),
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
        studentId: user.studentId
      }
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  login,
};
