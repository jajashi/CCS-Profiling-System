const jwt = require('jsonwebtoken');
const { getJwtSecret } = require('../config/jwtSecret');

function getBearerToken(req) {
  const header = req.headers.authorization;
  if (!header || typeof header !== 'string') return null;
  const parts = header.split(/\s+/);
  if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
    return parts[1].trim() || null;
  }
  return null;
}

function authenticate(req, res, next) {
  const token = getBearerToken(req);
  if (!token) {
    return res.status(401).json({ message: 'Authentication required.' });
  }

  const secret = getJwtSecret();
  if (!secret) {
    return res.status(500).json({ message: 'Server configuration error.' });
  }

  try {
    const decoded = jwt.verify(token, secret);
    req.user = {
      id: String(decoded.id),
      role: decoded.role,
      studentId: decoded.studentId != null ? String(decoded.studentId) : null,
      employeeId:
        decoded.employeeId != null && String(decoded.employeeId).trim() !== ''
          ? String(decoded.employeeId).trim()
          : null,
    };
    return next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
}

function requireRoles(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required.' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'You do not have permission to perform this action.' });
    }
    return next();
  };
}

module.exports = { authenticate, requireRoles };
